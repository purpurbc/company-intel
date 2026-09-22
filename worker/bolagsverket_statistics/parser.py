"""Parse Bolagsverket's aggregate CSV rows into stable source contracts."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from functools import lru_cache
from pathlib import Path
from typing import Callable

from worker.bulk_files.parser import SourceRow, clean_text

from .catalog import (
    COMPANY_FORM_COUNT_HEADERS,
    REPRESENTATIVE_ROLE_COUNT_HEADERS,
)


COUNTY_NAME_CODES = {
    "Stockholms län": "01",
    "Uppsala län": "03",
    "Södermanlands län": "04",
    "Östergötlands län": "05",
    "Jönköpings län": "06",
    "Kronobergs län": "07",
    "Kalmar län": "08",
    "Gotlands län": "09",
    "Blekinge län": "10",
    "Skåne län": "12",
    "Hallands län": "13",
    "Västra Götalands län": "14",
    "Värmlands län": "17",
    "Örebro län": "18",
    "Västmanlands län": "19",
    "Dalarnas län": "20",
    "Gävleborgs län": "21",
    "Västernorrlands län": "22",
    "Jämtlands län": "23",
    "Västerbottens län": "24",
    "Norrbottens län": "25",
}

GENDER_CODES = {
    "Kvinna": "F",
    "Man": "M",
    "Okänt": "UNKNOWN",
    "Org": "ORG",
}

AGE_BAND_CODES = {
    "Yngre än 50 år": "UNDER_50",
    "50 år och äldre": "50_PLUS",
    "Okänd": "UNKNOWN",
}

FORMATION_TYPE_CODES = {
    "Aktiebolag": "COMPANY",
    "Lagerbolag": "SHELF_COMPANY",
}

# SCB's checked-in company-search code table still uses the municipality's old
# display name. The code itself is stable and can safely resolve the new name.
MUNICIPALITY_NAME_ALIASES = {
    "malung-sälen": "2023",
}

SAS_MONTHS = {
    "JAN": 1,
    "FEB": 2,
    "MAR": 3,
    "APR": 4,
    "MAY": 5,
    "JUN": 6,
    "JUL": 7,
    "AUG": 8,
    "SEP": 9,
    "OCT": 10,
    "NOV": 11,
    "DEC": 12,
}


def _json_text(value: object) -> str:
    return json.dumps(
        value,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    )


def _digest(value: object) -> str:
    return hashlib.sha256(_json_text(value).encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class StatisticsRecord:
    row_number: int
    source_file: str
    payload: dict
    natural_key: dict
    data: dict

    @property
    def raw_hash(self) -> str:
        return _digest(self.payload)

    @property
    def natural_key_hash(self) -> str:
        return _digest(self.natural_key)

    @property
    def row_hash(self) -> str:
        return _digest(self.data)

    def copy_row(self) -> tuple:
        return (
            self.row_number,
            self.source_file,
            _json_text(self.payload),
            self.raw_hash,
            _json_text(self.natural_key),
            self.natural_key_hash,
            _json_text(self.data),
            self.row_hash,
        )


def _required_text(row: dict, header: str) -> str:
    value = clean_text(row.get(header))
    if value is None:
        raise ValueError(f"{header} is required")
    return value


def _integer(
    row: dict,
    header: str,
    *,
    required: bool = True,
    minimum: int | None = 0,
) -> int | None:
    value = clean_text(row.get(header))
    if value is None:
        if required:
            raise ValueError(f"{header} is required")
        return None
    if not re.fullmatch(r"-?\d+", value):
        raise ValueError(f"{header} must be an integer, got {value!r}")
    parsed = int(value)
    if minimum is not None and parsed < minimum:
        raise ValueError(f"{header} must be at least {minimum}, got {parsed}")
    return parsed


def _year(row: dict, header: str) -> int:
    value = _integer(row, header, minimum=1900)
    if value is None or value > 2100:
        raise ValueError(f"{header} must be a year between 1900 and 2100")
    return value


def _share(row: dict, header: str) -> float:
    value = _required_text(row, header).replace(",", ".")
    try:
        parsed = Decimal(value)
    except InvalidOperation as error:
        raise ValueError(f"{header} must be a decimal share, got {value!r}") from error
    if not parsed.is_finite() or parsed < 0:
        raise ValueError(f"{header} must be a non-negative decimal share")
    return float(parsed)


def _coded_value(row: dict, header: str, mapping: dict[str, str]) -> str:
    source_value = _required_text(row, header)
    try:
        return mapping[source_value]
    except KeyError as error:
        raise ValueError(f"Unknown {header} value {source_value!r}") from error


def _flag(row: dict, header: str, true_code: str) -> bool:
    source_value = clean_text(row.get(header))
    if source_value is None:
        return False
    if source_value != true_code:
        raise ValueError(f"Unknown {header} value {source_value!r}")
    return True


def _yes_no(row: dict, header: str) -> bool:
    source_value = _required_text(row, header)
    if source_value not in {"J", "N"}:
        raise ValueError(f"Unknown {header} value {source_value!r}")
    return source_value == "J"


def _source_timestamp(value: object) -> str | None:
    text = clean_text(value)
    if text is None:
        return None
    match = re.fullmatch(
        r"(\d{1,2})([A-Za-z]{3})(\d{4}):(\d{2}):(\d{2}):(\d{2})",
        text,
    )
    if not match or match.group(2).upper() not in SAS_MONTHS:
        raise ValueError(f"LADDATUM has an unknown format: {text!r}")
    day, month_text, year, hour, minute, second = match.groups()
    return datetime(
        int(year),
        SAS_MONTHS[month_text.upper()],
        int(day),
        int(hour),
        int(minute),
        int(second),
    ).isoformat()


def _canonical_county_code(source_code: str | None) -> str | None:
    if source_code is None or not source_code.isdigit() or int(source_code) <= 0:
        return None
    return source_code.zfill(2)


def _canonical_municipality_code(
    source_county_code: str | None, source_municipality_code: str | None
) -> str | None:
    county_code = _canonical_county_code(source_county_code)
    if (
        county_code is None
        or source_municipality_code is None
        or not source_municipality_code.isdigit()
        or int(source_municipality_code) <= 0
    ):
        return None
    return f"{county_code}{source_municipality_code.zfill(2)}"


@lru_cache(maxsize=1)
def _municipality_name_codes() -> dict[str, str]:
    path = (
        Path(__file__).parents[1]
        / "scb"
        / "data"
        / "Je"
        / "Kodtabell"
        / "Je_Kodtabell_SätesKommun.json"
    )
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {
        str(item["Text"]).casefold(): str(item["Varde"])
        for item in payload["VardeLista"]
        if item.get("Text") and item.get("Varde") not in {"0000", "9999"}
    }


def _county_code_from_name(value: str | None) -> str | None:
    return COUNTY_NAME_CODES.get(value or "")


def _municipality_code_from_name(value: str | None) -> str | None:
    if not value:
        return None
    name = re.sub(r"\s+kommun$", "", value, flags=re.IGNORECASE).strip()
    normalized_name = name.casefold()
    return MUNICIPALITY_NAME_ALIASES.get(
        normalized_name,
        _municipality_name_codes().get(normalized_name),
    )


def parse_company_statistics(source_row: SourceRow) -> StatisticsRecord:
    row = source_row.payload
    year = _year(row, "ar")
    month = _integer(row, "manad", minimum=1)
    if month is None or month > 12:
        raise ValueError("manad must be between 1 and 12")
    event_code = _integer(row, "handelse", minimum=1)
    if event_code not in {1, 2, 3}:
        raise ValueError("handelse must be 1, 2 or 3")
    period_key = _required_text(row, "armanad")
    if period_key != f"{year:04d}{month:02d}":
        raise ValueError(
            f"armanad {period_key!r} does not match ar/manad {year}/{month}"
        )

    region_family_code = clean_text(row.get("regfam"))
    if region_family_code == ".":
        region_family_code = None
    source_county_code = clean_text(row.get("SATELAN"))
    source_municipality_code = clean_text(row.get("SATEKOMMUN"))
    if source_municipality_code == ".":
        source_municipality_code = None

    data = {
        "period_start": f"{year:04d}-{month:02d}-01",
        "event_code": event_code,
        "region_family_code": region_family_code,
        "region_family_name": clean_text(row.get("regfamtext")),
        "source_county_code": source_county_code,
        "source_municipality_code": source_municipality_code,
        "county_code": _canonical_county_code(source_county_code),
        "municipality_code": _canonical_municipality_code(
            source_county_code, source_municipality_code
        ),
        "county_name": clean_text(row.get("LANTEXT")),
        "municipality_name": clean_text(row.get("KOMTEXT")),
        "source_loaded_at": _source_timestamp(row.get("LADDATUM")),
    }
    for header, code in COMPANY_FORM_COUNT_HEADERS:
        data[f"count_{code.lower()}"] = _integer(
            row, header, required=False, minimum=0
        )

    natural_key = {
        key: data[key]
        for key in (
            "period_start",
            "event_code",
            "region_family_code",
            "source_county_code",
            "source_municipality_code",
        )
    }
    return StatisticsRecord(
        source_row.source_row_number,
        source_row.source_file,
        row,
        natural_key,
        data,
    )


def parse_representative_statistics(source_row: SourceRow) -> StatisticsRecord:
    row = source_row.payload
    county_name = _required_text(row, "Lan")
    municipality_name = _required_text(row, "Kommun")
    county_code = _county_code_from_name(county_name)
    municipality_code = _municipality_code_from_name(municipality_name)
    if (
        county_code
        and municipality_code
        and not municipality_code.startswith(county_code)
    ):
        # The source contains historical county/municipality combinations (for
        # example Heby before the 2007 county transfer). A current SCB code
        # would silently attach that history to the wrong geography, so retain
        # the source names as the key and leave the canonical code unresolved.
        municipality_code = None

    private_public_code = clean_text(row.get("PrivatPublikt"))
    if private_public_code not in {None, "PRIV", "PUBL"}:
        raise ValueError(f"Unknown PrivatPublikt value {private_public_code!r}")

    data = {
        "year": _year(row, "Ar"),
        "organization_form_code": _required_text(row, "Foretagsform"),
        "county_code": county_code,
        "municipality_code": municipality_code,
        "county_name": county_name,
        "municipality_name": municipality_name,
        "private_public_code": private_public_code,
        "is_employee_representative": _flag(
            row, "Arbetstagarrepresentant", "A"
        ),
        "is_foreign_resident": _flag(row, "Utlandsbosatt", "U"),
        "is_resident_in_ees": _flag(row, "Bosatt_EES", "E"),
        "gender_code": _coded_value(row, "Kon", GENDER_CODES),
        "age_band_code": _coded_value(row, "Alder_intervall", AGE_BAND_CODES),
        "representative_entity_type_code": _required_text(row, "JurFys"),
        "has_coordination_number": _yes_no(row, "Samordningsnr"),
    }
    if data["representative_entity_type_code"] not in {"F", "J", "O"}:
        raise ValueError(
            "JurFys must be F (physical), J (legal) or O (unknown)"
        )
    for header, code in REPRESENTATIVE_ROLE_COUNT_HEADERS:
        data[f"count_{code.lower()}"] = _integer(row, header, minimum=0)

    # Natural keys follow the source dimensions, not our current code mapping.
    # A corrected/updated mapping must become a new version of the same source
    # row rather than looking like one removed key plus one unrelated new key.
    natural_key = {
        "year": data["year"],
        "source_organization_form": _required_text(row, "Foretagsform"),
        "source_county_name": county_name,
        "source_municipality_name": municipality_name,
        "source_private_public": clean_text(row.get("PrivatPublikt")),
        "source_employee_representative": clean_text(
            row.get("Arbetstagarrepresentant")
        ),
        "source_foreign_resident": clean_text(row.get("Utlandsbosatt")),
        "source_resident_in_ees": clean_text(row.get("Bosatt_EES")),
        "source_gender": _required_text(row, "Kon"),
        "source_age_band": _required_text(row, "Alder_intervall"),
        "source_entity_type": _required_text(row, "JurFys"),
        "source_coordination_number": _required_text(row, "Samordningsnr"),
    }

    return StatisticsRecord(
        source_row.source_row_number,
        source_row.source_file,
        row,
        natural_key,
        data,
    )


def parse_auditor_reservation_statistics(
    source_row: SourceRow,
) -> StatisticsRecord:
    row = source_row.payload
    data = {
        "registration_year": _year(row, "Registreringsar_NO"),
        "formation_type_code": _coded_value(
            row, "AktiebolagLagerbolagNYB", FORMATION_TYPE_CODES
        ),
        "company_count": _integer(row, "Antal_foretag_CNT", minimum=0),
        "with_auditor_at_formation_count": _integer(
            row, "Antal_foretag_rev_nyb_CNT", minimum=0
        ),
        "with_auditor_reservation_count": _integer(
            row, "Antal_foretag_rev_forb_CNT", minimum=0
        ),
        "without_auditor_with_reservation_count": _integer(
            row, "Antal_foretag_rev_forb_utan_CNT", minimum=0
        ),
        "with_auditor_reservation_share": _share(
            row, "Andel_med_revisorsforb_CNT"
        ),
        "without_auditor_with_reservation_share": _share(
            row, "Andel_utan_rev_med_forb_CNT"
        ),
    }
    natural_key = {
        "registration_year": data["registration_year"],
        "source_formation_type": _required_text(
            row, "AktiebolagLagerbolagNYB"
        ),
    }
    return StatisticsRecord(
        source_row.source_row_number,
        source_row.source_file,
        row,
        natural_key,
        data,
    )


def parse_filing_delay_statistics(source_row: SourceRow) -> StatisticsRecord:
    row = source_row.payload
    county_name = clean_text(row.get("Lan_NM"))
    county_code = _county_code_from_name(county_name)
    data = {
        "period_through_year": _year(row, "Period_tom_DT"),
        "accounting_period_group": clean_text(
            row.get("Rakenskapsperiod_grupperad_CD")
        ),
        "county_code": county_code,
        "county_name": county_name,
        "expected_to_file_count": _integer(row, "Ska_skicka_in_CNT", minimum=0),
        "late_fee_count": _integer(row, "Forseningsavgift_CNT", minimum=0),
        "filed_annual_report_count": _integer(
            row, "Antal_inkomna_arsred_CNT", minimum=0
        ),
        "filed_annual_report_share": _share(row, "Andel_arsredovisning_CNT"),
        "late_fee_share": _share(row, "Andel_forsningsavgift_CNT"),
    }
    natural_key = {
        "period_through_year": data["period_through_year"],
        "source_accounting_period_group": clean_text(
            row.get("Rakenskapsperiod_grupperad_CD")
        ),
        "source_county_name": county_name,
    }
    return StatisticsRecord(
        source_row.source_row_number,
        source_row.source_file,
        row,
        natural_key,
        data,
    )


PARSERS: dict[str, Callable[[SourceRow], StatisticsRecord]] = {
    "companies": parse_company_statistics,
    "representatives": parse_representative_statistics,
    "auditor_reservations": parse_auditor_reservation_statistics,
    "filing_delays": parse_filing_delay_statistics,
}


def parse_statistics_row(dataset_key: str, source_row: SourceRow) -> StatisticsRecord:
    try:
        parser = PARSERS[dataset_key]
    except KeyError as error:
        raise ValueError(f"Unknown statistics dataset {dataset_key!r}") from error
    try:
        return parser(source_row)
    except Exception as error:
        raise ValueError(
            f"Invalid {dataset_key} row {source_row.source_row_number} "
            f"in {source_row.source_file}: {error}"
        ) from error
