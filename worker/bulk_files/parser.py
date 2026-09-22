from __future__ import annotations

import csv
import codecs
import io
import re
import zipfile
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import urlparse
from urllib.request import urlopen

from worker.bulk_files.code_lists import (
    BOLAGSVERKET_COUNTRY,
    BOLAGSVERKET_DEREGISTRATION_REASON,
    BOLAGSVERKET_IDENTITY_TYPE,
    BOLAGSVERKET_ORGANIZATION_FORM,
    BOLAGSVERKET_ORGANIZATION_NAME_TYPE,
    BOLAGSVERKET_RESTRUCTURING_PROCEDURE,
    SCB_ADVERTISING_STATUS,
    SCB_COMPANY_STATUS,
    SCB_LEGAL_FORM,
    SCB_LEGAL_UNIT_STATUS,
)


@dataclass(frozen=True)
class SourceRow:
    source_file: str
    source_row_number: int
    payload: dict[str, Any]


@dataclass(frozen=True)
class ScbBulkCompany:
    source_file: str
    source_row_number: int
    payload: dict[str, Any]
    pe_org_nr: str
    org_nr: str | None
    change_type_code: str | None
    name: str
    registered_company_name: str | None
    company_status_code: str | None
    company_status_name: str | None
    legal_unit_status_code: str | None
    legal_unit_status_name: str | None
    legal_form_code: str | None
    legal_form_name: str | None
    postal_address: str | None
    co_address: str | None
    postal_code: str | None
    postal_city: str | None
    industry_code_1: str | None
    industry_code_2: str | None
    industry_code_3: str | None
    industry_code_4: str | None
    industry_code_5: str | None
    registration_date: date | None
    advertising_status_code: str | None
    advertising_status_name: str | None
    change_flags: dict[str, str]


@dataclass(frozen=True)
class BolagsverketCompanyName:
    ordinal: int
    name: str
    name_type_code: str | None
    name_type_name: str | None
    registered_on: date | None
    business_description: str | None


@dataclass(frozen=True)
class BolagsverketRestructuringProcedure:
    ordinal: int
    procedure_code: str | None
    procedure_name: str | None
    procedure_text: str | None
    started_on: date | None


@dataclass(frozen=True)
class BolagsverketCompany:
    source_file: str
    source_row_number: int
    payload: dict[str, Any]
    identity_value: str
    identity_type_code: str
    identity_type_name: str | None
    org_nr: str | None
    name_protection_sequence: str
    registration_country_code: str | None
    registration_country_name: str | None
    organization_form_code: str | None
    organization_form_name: str | None
    deregistered_on: date | None
    deregistration_reason_code: str | None
    deregistration_reason_name: str | None
    registered_on: date | None
    business_description: str | None
    postal_address: str | None
    postal_co_address: str | None
    postal_code: str | None
    postal_city: str | None
    postal_country_code: str | None
    postal_country_name: str | None
    names: list[BolagsverketCompanyName]
    restructuring_procedures: list[BolagsverketRestructuringProcedure]


def clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = clean_source_value(value).strip()
    if not text or text == "*":
        return None
    return text


def clean_source_value(value: Any) -> str:
    text = str(value)
    return text.replace("\x00", "")


def compact_digits(value: Any) -> str | None:
    text = clean_text(value)
    if text is None:
        return None

    digits = re.sub(r"\D", "", text)
    return digits or None


def parse_date(value: Any) -> date | None:
    text = clean_text(value)
    if text is None:
        return None

    text = text.removesuffix(".0")
    if re.fullmatch(r"\d{8}", text):
        return date(int(text[0:4]), int(text[4:6]), int(text[6:8]))

    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        year, month, day = text.split("-")
        return date(int(year), int(month), int(day))

    return None


def derive_org_nr_from_pe_org_nr(pe_org_nr: str | None) -> str | None:
    digits = compact_digits(pe_org_nr)
    if digits is None:
        return None
    if len(digits) == 10:
        return digits
    if len(digits) == 12:
        return digits[-10:]
    return None


def derive_pe_org_nr_from_org_nr(org_nr: str | None) -> str | None:
    digits = compact_digits(org_nr)
    if digits is None:
        return None
    if len(digits) == 12:
        return digits
    if len(digits) == 10:
        return f"16{digits}"
    return digits


def format_sni_code(value: str | None) -> str | None:
    code = compact_digits(value)
    if code is None:
        return None
    return code.zfill(5)


def format_sni_code_p(value: str | None) -> str | None:
    code = format_sni_code(value)
    if code is None:
        return None
    return f"{code[:2]}.{code[2:]}"


def is_url(source: str | Path) -> bool:
    if not isinstance(source, str):
        return False

    parsed = urlparse(source)
    return parsed.scheme in {"http", "https"}


def read_first_txt_from_zip(source_name: str, raw: bytes) -> tuple[str, bytes]:
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        member = first_txt_zip_member(archive, source_name)
        return f"{source_name}:{member.filename}", archive.read(member)


def first_txt_zip_member(
    archive: zipfile.ZipFile,
    source_name: str,
) -> zipfile.ZipInfo:
    members = [
        info
        for info in archive.infolist()
        if not info.is_dir() and info.filename.lower().endswith(".txt")
    ]
    if not members:
        raise RuntimeError(f"No .txt file found inside {source_name}")

    return sorted(members, key=lambda info: info.filename)[0]


def read_source_bytes(source: str | Path) -> tuple[str, bytes]:
    if is_url(source):
        with urlopen(str(source), timeout=120) as response:
            raw = response.read()

        name = Path(urlparse(str(source)).path).name or str(source)
        if name.lower().endswith(".zip"):
            return read_first_txt_from_zip(name, raw)
        return name, raw

    path = Path(source)
    if not path.exists():
        raise FileNotFoundError(path)

    if path.suffix.lower() != ".zip":
        return path.name, path.read_bytes()

    return read_first_txt_from_zip(path.name, path.read_bytes())


def decode_text(raw: bytes) -> tuple[str, str]:
    encoding = detect_text_encoding(raw)
    return raw.decode(encoding, errors="replace"), encoding


def detect_text_encoding(raw: bytes) -> str:
    if raw.startswith(codecs.BOM_UTF8):
        return 'utf-8-sig'
    candidates = []
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            # A sample can end halfway through a UTF-8 character.
            text = codecs.getincrementaldecoder(encoding)().decode(raw, final=False)
        except UnicodeDecodeError:
            continue

        score = text.count("\ufffd") * 100 + text.count("Ã") * 10
        candidates.append((score, encoding))

    if not candidates:
        return "utf-8"

    _, encoding = min(candidates, key=lambda item: item[0])
    return encoding


@contextmanager
def open_source_text(source: str | Path) -> Iterator[tuple[str, io.TextIOBase]]:
    if is_url(source):
        source_file, raw = read_source_bytes(source)
        text, _ = decode_text(raw)
        yield source_file, io.StringIO(text)
        return

    path = Path(source)
    if not path.exists():
        raise FileNotFoundError(path)

    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as archive:
            member = first_txt_zip_member(archive, path.name)
            with archive.open(member) as sample_stream:
                encoding = detect_text_encoding(sample_stream.read(65536))
            with archive.open(member) as binary_stream:
                with io.TextIOWrapper(
                    binary_stream,
                    encoding=encoding,
                    errors="replace",
                    newline="",
                ) as text_stream:
                    yield f"{path.name}:{member.filename}", text_stream
        return

    with path.open("rb") as sample_stream:
        encoding = detect_text_encoding(sample_stream.read(65536))
    with path.open("rb") as binary_stream:
        with io.TextIOWrapper(
            binary_stream,
            encoding=encoding,
            errors="replace",
            newline="",
        ) as text_stream:
            yield path.name, text_stream


def iter_delimited_rows(
    path: str | Path,
    delimiter: str,
    skip_source_rows_through: int = 0,
    progress_every: int = 0,
    required_headers: set[str] | None = None,
) -> Iterator[SourceRow]:
    with open_source_text(path) as (source_file, text_stream):
        csv.field_size_limit(16 * 1024 * 1024)
        reader = csv.reader(text_stream, delimiter=delimiter,
                            quoting=csv.QUOTE_NONE if delimiter == '\t' else csv.QUOTE_MINIMAL,
                            escapechar='\\' if delimiter == ';' else None,
                            strict=False)

        try:
            headers = next(reader)
        except StopIteration:
            if required_headers:
                raise ValueError(f'{source_file}: empty input file')
            return

        headers = [header.strip().lstrip("\ufeff") for header in headers]
        if required_headers and not required_headers.issubset(headers):
            raise ValueError(f'{source_file}: missing required headers {sorted(required_headers - set(headers))}')

        for row_number, row in enumerate(reader, start=2):
            if row_number <= skip_source_rows_through:
                if progress_every and row_number % (progress_every * 100) == 0:
                    print(f'Resume scan: {row_number:,}/{skip_source_rows_through:,}', flush=True)
                continue

            if not any(clean_text(cell) for cell in row):
                continue

            if len(row) < len([header for header in headers if header]):
                raise ValueError(f'{source_file}: record {row_number} has too few columns ({len(row)})')
            if any(cell for cell in row[len(headers):]):
                raise ValueError(f'{source_file}: record {row_number} has unexpected extra columns')

            payload: dict[str, Any] = {}
            for idx, header in enumerate(headers):
                if not header:
                    continue
                payload[header] = row[idx] if idx < len(row) else ""

            if len(row) > len(headers):
                payload["_extra"] = [
                    cell
                    for cell in row[len(headers) :]
                ]

            yield SourceRow(
                source_file=source_file,
                source_row_number=row_number,
                payload=payload,
            )


def parse_scb_bulk_row(source_row: SourceRow) -> ScbBulkCompany:
    row = source_row.payload
    pe_org_nr = compact_digits(row.get("PeOrgNr"))
    if pe_org_nr is None:
        raise ValueError("SCB bulk row is missing PeOrgNr")

    org_nr = derive_org_nr_from_pe_org_nr(pe_org_nr)
    registered_company_name = clean_text(row.get("Foretagsnamn"))
    name = registered_company_name or clean_text(row.get("Namn")) or org_nr or pe_org_nr

    company_status_code = clean_text(row.get("FtgStat"))
    legal_unit_status_code = clean_text(row.get("JEStat"))
    legal_form_code = clean_text(row.get("JurForm"))
    advertising_status_code = clean_text(row.get("Reklamsparrtyp"))

    return ScbBulkCompany(
        source_file=source_row.source_file,
        source_row_number=source_row.source_row_number,
        payload=row,
        pe_org_nr=pe_org_nr,
        org_nr=org_nr,
        change_type_code=clean_text(row.get("ForAndrTyp")),
        name=name,
        registered_company_name=registered_company_name,
        company_status_code=company_status_code,
        company_status_name=SCB_COMPANY_STATUS.get(company_status_code or ""),
        legal_unit_status_code=legal_unit_status_code,
        legal_unit_status_name=SCB_LEGAL_UNIT_STATUS.get(legal_unit_status_code or ""),
        legal_form_code=legal_form_code,
        legal_form_name=SCB_LEGAL_FORM.get(legal_form_code or ""),
        postal_address=clean_text(row.get("Gatuadress")),
        co_address=clean_text(row.get("COAdress")),
        postal_code=(re.sub(r'\s', '', clean_text(row.get('PostNr')) or '') or None),
        postal_city=clean_text(row.get("PostOrt")),
        industry_code_1=format_sni_code(row.get("Ng1")),
        industry_code_2=format_sni_code(row.get("Ng2")),
        industry_code_3=format_sni_code(row.get("Ng3")),
        industry_code_4=format_sni_code(row.get("Ng4")),
        industry_code_5=format_sni_code(row.get("Ng5")),
        registration_date=parse_date(row.get("RegDatKtid")),
        advertising_status_code=advertising_status_code,
        advertising_status_name=SCB_ADVERTISING_STATUS.get(advertising_status_code or ""),
        change_flags={
            key: clean_text(value) or ""
            for key, value in row.items()
            if key.startswith("m")
        },
    )


def split_code_field(value: Any, known_codes: dict[str, str]) -> tuple[str | None, str | None]:
    text = clean_text(value)
    if text is None:
        return None, None

    if text in known_codes:
        return text, known_codes[text]

    parts = [part.strip() for part in text.split("$") if part.strip()]
    for part in parts:
        if part in known_codes:
            return part, known_codes[part]

    return text, None


def parse_organization_names(value: Any) -> list[BolagsverketCompanyName]:
    text = clean_text(value)
    if text is None:
        return []

    names: list[BolagsverketCompanyName] = []
    for ordinal, raw_name in enumerate(text.split("|"), start=1):
        parts = raw_name.split("$", maxsplit=3)
        name = clean_text(parts[0] if len(parts) > 0 else None)
        if name is None:
            continue

        name_type_code = clean_text(parts[1] if len(parts) > 1 else None)
        names.append(
            BolagsverketCompanyName(
                ordinal=ordinal,
                name=name,
                name_type_code=name_type_code,
                name_type_name=BOLAGSVERKET_ORGANIZATION_NAME_TYPE.get(
                    name_type_code or ""
                ),
                registered_on=parse_date(parts[2] if len(parts) > 2 else None),
                business_description=clean_text(parts[3] if len(parts) > 3 else None),
            )
        )

    return names


def parse_restructuring_procedures(
    value: Any,
) -> list[BolagsverketRestructuringProcedure]:
    text = clean_text(value)
    if text is None:
        return []

    procedures: list[BolagsverketRestructuringProcedure] = []
    for ordinal, raw_procedure in enumerate(text.split("|"), start=1):
        parts = raw_procedure.split("$", maxsplit=2)
        procedure_code = clean_text(parts[0] if len(parts) > 0 else None)
        procedure_text = clean_text(parts[1] if len(parts) > 1 else None)
        started_on = parse_date(parts[2] if len(parts) > 2 else None)

        # Bolagsverket currently also supplies records as ``code$date``. In
        # that shape the second value is the effective date, not descriptive
        # text. Accept both source variants and do not persist empty entries
        # produced by leading/trailing separators.
        if started_on is None:
            date_in_text_position = parse_date(procedure_text)
            if date_in_text_position is not None:
                started_on = date_in_text_position
                procedure_text = None
        if procedure_code is None and procedure_text is None and started_on is None:
            continue

        procedures.append(
            BolagsverketRestructuringProcedure(
                ordinal=ordinal,
                procedure_code=procedure_code,
                procedure_name=BOLAGSVERKET_RESTRUCTURING_PROCEDURE.get(
                    procedure_code or ""
                ),
                procedure_text=procedure_text,
                started_on=started_on,
            )
        )

    return procedures


def parse_postal_address(value: Any) -> dict[str, str | None]:
    text = clean_text(value)
    if text is None:
        return {
            "postal_address": None,
            "postal_co_address": None,
            "postal_code": None,
            "postal_city": None,
            "postal_country_code": None,
        }

    parts = text.split("$")
    parts += [""] * max(0, 5 - len(parts))
    address, co_address, third, fourth, country = parts[:5]
    third_clean = clean_text(third)
    fourth_clean = clean_text(fourth)

    if third_clean and re.fullmatch(r'[0-9]{3}\s?[0-9]{2}', third_clean):
        postal_code = re.sub(r'\s', '', third_clean)
        postal_city = fourth_clean
    else:
        postal_city = third_clean
        postal_code = fourth_clean

    return {
        "postal_address": clean_text(address),
        "postal_co_address": clean_text(co_address),
        "postal_code": postal_code,
        "postal_city": postal_city,
        "postal_country_code": clean_text(country),
    }


def primary_bolagsverket_name(names: list[BolagsverketCompanyName]) -> str | None:
    for name in names:
        if name.name_type_code == "FORETAGSNAMN-ORGNAM":
            return name.name
    return names[0].name if names else None


def bolagsverket_identity_type_code(row: dict[str, Any]) -> str | None:
    identity_raw = clean_text(row.get("organisationsidentitet"))
    if identity_raw is None:
        return None

    identity_parts = identity_raw.split("$", maxsplit=1)
    return clean_text(identity_parts[1] if len(identity_parts) > 1 else None)


def parse_bolagsverket_bulk_row(source_row: SourceRow) -> BolagsverketCompany:
    row = source_row.payload
    identity_raw = clean_text(row.get("organisationsidentitet"))
    if identity_raw is None:
        raise ValueError("Bolagsverket row is missing organisationsidentitet")

    identity_parts = identity_raw.split("$", maxsplit=1)
    identity_value = clean_text(identity_parts[0])
    identity_type_code = bolagsverket_identity_type_code(row)
    if identity_value is None or identity_type_code is None:
        raise ValueError(f"Invalid organisationsidentitet: {identity_raw}")

    identity_digits = compact_digits(identity_value)
    org_nr = None
    if identity_type_code == "ORGNR-IDORG":
        org_nr = identity_digits
    elif identity_type_code == "PERSON-IDORG" and identity_digits:
        org_nr = identity_digits[-10:]

    registration_country_code = clean_text(row.get("registreringsland"))
    organization_form_code = clean_text(row.get("organisationsform"))
    deregistration_reason_code, deregistration_reason_name = split_code_field(
        row.get("avregistreringsorsak"),
        BOLAGSVERKET_DEREGISTRATION_REASON,
    )
    names = parse_organization_names(row.get("organisationsnamn"))
    postal_address = parse_postal_address(row.get("postadress"))

    return BolagsverketCompany(
        source_file=source_row.source_file,
        source_row_number=source_row.source_row_number,
        payload=row,
        identity_value=identity_value,
        identity_type_code=identity_type_code,
        identity_type_name=BOLAGSVERKET_IDENTITY_TYPE.get(identity_type_code),
        org_nr=org_nr,
        name_protection_sequence=clean_text(row.get("namnskyddslopnummer")) or "",
        registration_country_code=registration_country_code,
        registration_country_name=BOLAGSVERKET_COUNTRY.get(
            registration_country_code or ""
        ),
        organization_form_code=organization_form_code,
        organization_form_name=BOLAGSVERKET_ORGANIZATION_FORM.get(
            organization_form_code or ""
        ),
        deregistered_on=parse_date(row.get("avregistreringsdatum")),
        deregistration_reason_code=deregistration_reason_code,
        deregistration_reason_name=deregistration_reason_name,
        registered_on=parse_date(row.get("registreringsdatum")),
        business_description=clean_text(row.get("verksamhetsbeskrivning")),
        postal_address=postal_address["postal_address"],
        postal_co_address=postal_address["postal_co_address"],
        postal_code=postal_address["postal_code"],
        postal_city=postal_address["postal_city"],
        postal_country_code=postal_address["postal_country_code"],
        postal_country_name=BOLAGSVERKET_COUNTRY.get(
            postal_address["postal_country_code"] or ""
        ),
        names=names,
        restructuring_procedures=parse_restructuring_procedures(
            row.get("pagandeAvvecklingsEllerOmstruktureringsforfarande")
        ),
    )


def iter_scb_bulk_companies(
    path: str | Path,
    skip_source_rows_through: int = 0,
) -> Iterator[ScbBulkCompany]:
    for source_row in iter_delimited_rows(
        path,
        delimiter="\t",
        skip_source_rows_through=skip_source_rows_through,
    ):
        yield parse_scb_bulk_row(source_row)


def iter_bolagsverket_bulk_companies(
    path: str | Path,
    skip_source_rows_through: int = 0,
) -> Iterator[BolagsverketCompany]:
    for source_row in iter_delimited_rows(
        path,
        delimiter=";",
        skip_source_rows_through=skip_source_rows_through,
    ):
        yield parse_bolagsverket_bulk_row(source_row)
