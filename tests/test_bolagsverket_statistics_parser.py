from worker.bolagsverket_statistics.catalog import DATASETS, select_dataset_keys
from worker.bolagsverket_statistics.parser import (
    parse_auditor_reservation_statistics,
    parse_company_statistics,
    parse_filing_delay_statistics,
    parse_representative_statistics,
)
from worker.bulk_files.parser import SourceRow


def source(payload, row=2):
    return SourceRow("statistics.csv", row, payload)


def test_company_statistics_normalizes_period_geography_and_missing_counts():
    record = parse_company_statistics(
        source(
            {
                "ar": "2026",
                "manad": "9",
                "handelse": "1",
                "regfam": "1",
                "regfamtext": "Storstadsområden",
                "SATELAN": "1",
                "SATEKOMMUN": "14",
                "LANTEXT": "Stockholms län",
                "KOMTEXT": "Upplands Väsby",
                "AB": "42",
                "LADDATUM": "10SEP2026:15:16:20",
                "armanad": "202609",
            }
        )
    )

    assert record.data["period_start"] == "2026-09-01"
    assert record.data["county_code"] == "01"
    assert record.data["municipality_code"] == "0114"
    assert record.data["count_ab"] == 42
    assert record.data["count_bab"] is None
    assert record.data["source_loaded_at"] == "2026-09-10T15:16:20"


def test_representative_history_does_not_apply_current_code_to_old_geography():
    payload = {
        "Ar": "2006",
        "Foretagsform": "AB",
        "Lan": "Västmanlands län",
        "Kommun": "Heby kommun",
        "PrivatPublikt": "PRIV",
        "Arbetstagarrepresentant": "",
        "Utlandsbosatt": "",
        "Bosatt_EES": "",
        "Kon": "Kvinna",
        "Alder_intervall": "Yngre än 50 år",
        "JurFys": "F",
        "Samordningsnr": "N",
    }
    payload.update({header: "0" for header in DATASETS["representatives"].required_headers if header.startswith("Antal_")})
    record = parse_representative_statistics(source(payload))

    assert record.data["county_code"] == "19"
    assert record.data["municipality_code"] is None
    assert record.natural_key["source_county_name"] == "Västmanlands län"
    assert record.natural_key["source_municipality_name"] == "Heby kommun"


def test_representative_current_malung_salen_name_uses_stable_scb_code():
    payload = {
        "Ar": "2026",
        "Foretagsform": "AB",
        "Lan": "Dalarnas län",
        "Kommun": "Malung-Sälen kommun",
        "PrivatPublikt": "PRIV",
        "Arbetstagarrepresentant": "",
        "Utlandsbosatt": "",
        "Bosatt_EES": "",
        "Kon": "Man",
        "Alder_intervall": "50 år och äldre",
        "JurFys": "F",
        "Samordningsnr": "N",
    }
    payload.update({header: "0" for header in DATASETS["representatives"].required_headers if header.startswith("Antal_")})
    record = parse_representative_statistics(source(payload))

    assert record.data["municipality_code"] == "2023"


def test_auditor_reservation_decimal_comma_and_natural_key():
    record = parse_auditor_reservation_statistics(
        source(
            {
                "Registreringsar_NO": "2025",
                "AktiebolagLagerbolagNYB": "Aktiebolag",
                "Antal_foretag_CNT": "100",
                "Antal_foretag_rev_nyb_CNT": "20",
                "Antal_foretag_rev_forb_CNT": "30",
                "Antal_foretag_rev_forb_utan_CNT": "10",
                "Andel_med_revisorsforb_CNT": "0,3000",
                "Andel_utan_rev_med_forb_CNT": "0,1250",
            }
        )
    )

    assert record.natural_key == {
        "registration_year": 2025,
        "source_formation_type": "Aktiebolag",
    }
    assert record.data["with_auditor_reservation_share"] == 0.3


def test_filing_share_may_exceed_one_and_unknown_county_name_stays_in_key():
    record = parse_filing_delay_statistics(
        source(
            {
                "Period_tom_DT": "2026",
                "Rakenskapsperiod_grupperad_CD": "2025-01--2025-12",
                "Lan_NM": "Historiskt län",
                "Ska_skicka_in_CNT": "100",
                "Forseningsavgift_CNT": "8",
                "Antal_inkomna_arsred_CNT": "102",
                "Andel_arsredovisning_CNT": "1,0200",
                "Andel_forsningsavgift_CNT": "0,0800",
            }
        )
    )

    assert record.data["filed_annual_report_share"] == 1.02
    assert record.natural_key["source_county_name"] == "Historiskt län"


def test_dataset_selection_is_unique_and_catalog_ordered():
    assert select_dataset_keys(["filing_delays", "companies", "companies"]) == [
        "companies",
        "filing_delays",
    ]
