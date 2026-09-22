"""One authoritative catalog for Bolagsverket's public statistics files."""

from __future__ import annotations

from dataclasses import dataclass


BASE_URL = "https://www.bolagsverket.se/statistik"
LICENSE_NAME = "CC BY 2.5 SE"
LICENSE_URL = "https://creativecommons.org/licenses/by/2.5/se/"


COMPANY_DIMENSION_HEADERS = (
    "ar",
    "manad",
    "handelse",
    "regfam",
    "regfamtext",
    "SATELAN",
    "SATEKOMMUN",
    "LANTEXT",
    "KOMTEXT",
)

# Source column -> canonical organization-form code. The live CSV contains
# newer forms that are not present in the older XLSX field description.
COMPANY_FORM_COUNT_HEADERS = (
    ("AB", "AB"),
    ("BAB", "BAB"),
    ("BF", "BF"),
    ("BRF", "BRF"),
    ("EK", "EK"),
    ("E", "E"),
    ("SE", "SE"),
    ("FL", "FL"),
    ("FAB", "FAB"),
    ("HB", "HB"),
    ("I", "I"),
    ("KB", "KB"),
    ("KHF", "KHF"),
    ("MB", "MB"),
    ("SF", "SF"),
    ("SB", "SB"),
    ("TSF", "TSF"),
    ("BFL", "BFL"),
    ("OFB", "OFB"),
    ("SCE", "SCE"),
    ("S", "S"),
    ("EGTS", "EGTS"),
    ("FOF", "FOF"),
    ("TPAB", "TPAB"),
    ("OTPB", "OTPB"),
    ("TPF", "TPF"),
)

REPRESENTATIVE_DIMENSION_HEADERS = (
    "Ar",
    "Foretagsform",
    "Lan",
    "Kommun",
    "PrivatPublikt",
    "Arbetstagarrepresentant",
    "Utlandsbosatt",
    "Bosatt_EES",
    "Kon",
    "Alder_intervall",
    "JurFys",
    "Samordningsnr",
)

# Source count column -> canonical role code.
REPRESENTATIVE_ROLE_COUNT_HEADERS = (
    ("Antal_AK", "AK"),
    ("Antal_BO", "BO"),
    ("Antal_DELG", "DELG"),
    ("Antal_EFT", "EFT"),
    ("Antal_EVD", "EVD"),
    ("Antal_EVVD", "EVVD"),
    ("Antal_FO", "FO"),
    ("Antal_IN", "IN"),
    ("Antal_KD", "KD"),
    ("Antal_KP", "KP"),
    ("Antal_LE", "LE"),
    ("Antal_LI", "LI"),
    ("Antal_LS", "LS"),
    ("Antal_OF", "OF"),
    ("Antal_PO", "PO"),
    ("Antal_REP", "REP"),
    ("Antal_REV", "REV"),
    ("Antal_REVH", "REVH"),
    ("Antal_REVL", "REVL"),
    ("Antal_REVS", "REVS"),
    ("Antal_REVSL", "REVSL"),
    ("Antal_REVST", "REVST"),
    ("Antal_REVT", "REVT"),
    ("Antal_SU", "SU"),
    ("Antal_SVD", "SVD"),
    ("Antal_VD", "VD"),
    ("Antal_VLE", "VLE"),
    ("Antal_VOF", "VOF"),
    ("Antal_VVD", "VVD"),
)


@dataclass(frozen=True, slots=True)
class DatasetDefinition:
    """Stable download and CSV contract for one source dataset."""

    key: str
    filename: str
    description: str
    delimiter: str
    required_headers: tuple[str, ...]
    update_frequency: str | None = None
    license_name: str = LICENSE_NAME
    license_url: str = LICENSE_URL

    @property
    def url(self) -> str:
        return f"{BASE_URL}/{self.filename}"


DATASETS = {
    "companies": DatasetDefinition(
        key="companies",
        filename="ftgstat_oppna.csv",
        description="Statistik om företag och föreningar",
        delimiter=",",
        update_frequency="Första vardagen varje månad",
        required_headers=(
            *COMPANY_DIMENSION_HEADERS,
            *(header for header, _code in COMPANY_FORM_COUNT_HEADERS),
            "LADDATUM",
            "armanad",
        ),
    ),
    "representatives": DatasetDefinition(
        key="representatives",
        filename="foretradare_historik.csv",
        description="Statistik om företrädare och företagsform",
        delimiter=";",
        update_frequency="Första vardagen varje månad",
        required_headers=(
            *REPRESENTATIVE_DIMENSION_HEADERS,
            *(header for header, _code in REPRESENTATIVE_ROLE_COUNT_HEADERS),
        ),
    ),
    "auditor_reservations": DatasetDefinition(
        key="auditor_reservations",
        filename="rev_forbehall.csv",
        description="Statistik om revisorsförbehåll",
        delimiter=";",
        required_headers=(
            "Registreringsar_NO",
            "AktiebolagLagerbolagNYB",
            "Antal_foretag_CNT",
            "Antal_foretag_rev_nyb_CNT",
            "Antal_foretag_rev_forb_CNT",
            "Antal_foretag_rev_forb_utan_CNT",
            "Andel_med_revisorsforb_CNT",
            "Andel_utan_rev_med_forb_CNT",
        ),
    ),
    "filing_delays": DatasetDefinition(
        key="filing_delays",
        filename="rakenskaps_forsening.csv",
        description="Statistik om räkenskapsår och förseningsavgifter",
        delimiter=";",
        required_headers=(
            "Period_tom_DT",
            "Rakenskapsperiod_grupperad_CD",
            "Lan_NM",
            "Ska_skicka_in_CNT",
            "Forseningsavgift_CNT",
            "Antal_inkomna_arsred_CNT",
            "Andel_arsredovisning_CNT",
            "Andel_forsningsavgift_CNT",
        ),
    ),
}


def select_dataset_keys(values: list[str] | None) -> list[str]:
    """Return catalog-ordered unique dataset keys, or every key for ``all``."""

    if not values or "all" in values:
        return list(DATASETS)
    unknown = set(values) - set(DATASETS)
    if unknown:
        raise ValueError(f"Unknown datasets: {', '.join(sorted(unknown))}")
    selected = set(values)
    return [key for key in DATASETS if key in selected]
