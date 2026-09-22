from datetime import date

from api.services.company_service import (
    _duplicates_detailed_change,
    _event_title,
    _is_generic_company_event,
    _registration_details,
    _registration_events,
    _turnover_event_details,
)
from worker.bulk_files.parser import parse_restructuring_procedures


def registration(
    version_id,
    registered_on,
    name,
    name_registered_on,
    description,
    deregistered_on=None,
    reason=None,
):
    return {
        "registration_version_id": version_id,
        "registration": {
            "registered_on": registered_on,
            "deregistered_on": deregistered_on,
            "deregistration_reason_code": reason,
            "business_description": description,
        },
        "names": [
            {
                "name": name,
                "registered_on": name_registered_on,
                "name_type_code": "FORETAGSNAMN-ORGNAM",
            }
        ],
        "procedures": [],
        "valid_from": "2026-08-30T19:41:59+02:00",
        "source": "bolagsverket",
    }


def test_detail_uses_first_registration_date_and_current_description():
    old = registration(
        1,
        "1995-02-08",
        "Idéplast i Sundsvall",
        "1995-02-08",
        "Äldre beskrivning",
        "2024-09-18",
        "VERKUPP-AVORG",
    )
    current = registration(
        2,
        "2012-02-08",
        "ILF Maskin",
        "2025-05-02",
        "Nuvarande beskrivning",
    )

    details = _registration_details(
        [old, current],
        ["ILF Maskin", "Ölén, Hans Christer"],
    )

    assert details == {
        "bolagsverket_registration_date": "1995-02-08",
        "bolagsverket_registration_active": True,
        "registered_name_date": "2025-05-02",
        "business_description": "Nuvarande beskrivning",
    }


def test_registration_events_explain_name_and_deregistration_without_codes():
    row = registration(
        3,
        "2020-05-05",
        "Idéplast i Sundsvall",
        "2020-05-05",
        "Hushållsprodukter",
        "2024-09-18",
        "VERKUPP-AVORG",
    )

    events = _registration_events(row)
    rendered = " ".join(
        f"{event['title']} {event['description'] or ''}" for event in events
    )

    assert "Idéplast i Sundsvall registrerades hos Bolagsverket" in rendered
    assert "Verksamheten har upphört" in rendered
    assert "VERKUPP-AVORG" not in rendered
    assert "Namnskydd" not in rendered


def test_registration_events_include_every_distinct_name():
    row = registration(
        4,
        "2020-05-05",
        "Huvudnamnet AB",
        "2020-05-05",
        "Konsultverksamhet",
    )
    row["names"].extend([
        {
            "ordinal": 2,
            "name": "Specialisten",
            "registered_on": "2021-06-01",
            "name_type_code": "SARS_FORNAMN-ORGNAM",
            "name_type_name": "Särskilt företagsnamn",
        },
        {
            "ordinal": 3,
            "name": "The Specialist",
            "registered_on": "2022-07-01",
            "name_type_code": "FORNAMN_FRSPRAK-ORGNAM",
            "name_type_name": "Företagsnamn på främmande språk",
        },
    ])

    events = _registration_events(row)
    titles = [event["title"] for event in events]

    assert "Huvudnamnet AB registrerades hos Bolagsverket" in titles
    assert "Det särskilda företagsnamnet Specialisten registrerades" in titles
    assert (
        "Företagsnamnet The Specialist registrerades på främmande språk"
        in titles
    )


def test_procedure_date_is_normalized_and_empty_entries_are_ignored():
    procedures = parse_restructuring_procedures("|LI-AVOMFO$2026-05-11")

    assert len(procedures) == 1
    assert procedures[0].procedure_code == "LI-AVOMFO"
    assert procedures[0].procedure_text is None
    assert procedures[0].started_on == date(2026, 5, 11)

    row = registration(
        5,
        "2023-10-24",
        "Z&Z Orthopedics AB",
        "2023-10-24",
        "Konsultverksamhet inom sjukvården",
    )
    # Mirror already imported data, where the date remains in procedure_text.
    row["procedures"] = [
        {"ordinal": 1},
        {
            "ordinal": 2,
            "procedure_code": "LI-AVOMFO",
            "procedure_name": "Likvidation",
            "procedure_text": "2026-05-11",
        },
    ]

    procedure_events = [
        event for event in _registration_events(row) if event["kind"] == "procedure"
    ]
    assert len(procedure_events) == 1
    assert procedure_events[0]["title"] == "Likvidation inleddes"
    assert procedure_events[0]["effective_at"] == date(2026, 5, 11)
    assert "likvidationsförfarande hade inletts" in procedure_events[0]["description"]


def test_named_procedure_uses_its_started_on_date():
    row = registration(
        6,
        "2014-03-03",
        "Drivers Akuten AB",
        "2020-10-19",
        "Förartjänster",
    )
    row["procedures"] = [{
        "ordinal": 2,
        "started_on": "2026-03-23",
        "procedure_code": "LI-AVOMFO",
        "procedure_name": "Likvidation",
        "procedure_text": None,
    }]

    procedure_event = next(
        event for event in _registration_events(row) if event["kind"] == "procedure"
    )

    assert procedure_event["title"] == "Likvidation inleddes"
    assert procedure_event["effective_at"] == "2026-03-23"
    assert procedure_event["new_label"] == "Likvidation"


def test_all_known_procedure_codes_have_explicit_swedish_copy():
    row = registration(
        8,
        "2020-01-01",
        "Exempel AB",
        "2020-01-01",
        "Exempelverksamhet",
    )
    row["procedures"] = [{
        "ordinal": 1,
        "started_on": "2026-01-02",
        "procedure_code": "FUOT-AVOMFO",
        "procedure_name": "Övertagande i fusion",
    }]

    procedure_event = next(
        event for event in _registration_events(row) if event["kind"] == "procedure"
    )

    assert procedure_event["title"] == "Övertagande i fusion registrerades"
    assert procedure_event["description"] == (
        "Bolagsverket registrerade företaget som övertagande i en fusion."
    )


def test_generated_activity_event_does_not_duplicate_detailed_change():
    detected_at = "2026-08-30T18:51:34+02:00"
    event = {
        "event_type": "company_inactive",
        "ingestion_run_id": 16,
        "detected_at": detected_at,
        "source": "scb_bulk",
    }
    change = {
        "id": 19,
        "field_name": "activity_status_code",
        "old_value": "1",
        "new_value": "9",
        "old_label": "Är verksam",
        "new_label": "Ej verksam, enligt företagsregistrets kriterier",
        "detected_at": detected_at,
        "ingestion_run_id": 16,
        "importance": 5,
        "source": "scb_bulk",
    }

    assert _duplicates_detailed_change(event, [change])
    assert _event_title("Activity status changed") == "Verksamhetsstatus ändrades"
    assert _event_title("Företagsstatus ändrades") == "Verksamhetsstatus ändrades"


def test_bolagsverket_code_copy_uses_official_swedish_terms():
    row = registration(
        7,
        "2020-01-01",
        "Exempel AB",
        "2020-01-01",
        "Exempelverksamhet",
        "2026-01-01",
        "OVERK-AVORG",
    )

    deregistration = next(
        event
        for event in _registration_events(row)
        if event["field_name"] == "deregistered_on"
    )

    assert deregistration["new_label"] == "Overksamhet"
    assert "Verksamheten var overksam" not in deregistration["description"]


def test_generic_ingestion_events_are_not_user_events():
    assert _is_generic_company_event({
        "event_type": "new_company",
        "title": "Nytt företag i databasen.",
    })
    assert _is_generic_company_event({
        "event_type": "legacy",
        "title": "Nytt företag i databasen.",
    })
    assert not _is_generic_company_event({
        "event_type": "vat_registered",
        "title": "Blev registrerad för moms",
    })


def test_turnover_event_uses_descriptive_intervals_instead_of_arrows():
    detected_at = "2026-05-26T08:37:16+02:00"
    event = {
        "title": "Omsättningsklass ökade",
        "ingestion_run_id": 7,
        "detected_at": detected_at,
        "source": "legacy",
    }
    changes = [
        {
            "field_name": "turnover_class_code",
            "old_value": "1",
            "new_value": "3",
            "old_label": "1 - 499 tkr",
            "new_label": "1 000 - 4 999 tkr",
            "ingestion_run_id": 7,
            "detected_at": detected_at,
            "source": "legacy",
        },
        {
            "field_name": "turnover_detail_class_code",
            "old_value": "4",
            "new_value": "11",
            "old_label": "100 - 149 tkr",
            "new_label": "1 000 - 2 499 tkr",
            "ingestion_run_id": 7,
            "detected_at": detected_at,
            "source": "legacy",
        },
    ]

    description = _turnover_event_details(event, changes)

    assert description is not None
    assert "Omsättningsintervallet ändrades från" in description
    assert "Det detaljerade omsättningsintervallet" in description
    assert "->" not in description
