from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from psycopg import Connection


@dataclass(frozen=True)
class TrackedField:
    importance: int = 1
    label_field: str | None = None


@dataclass(frozen=True)
class DetectedChange:
    field_name: str
    old_value: Any
    new_value: Any
    old_label: Any
    new_label: Any
    importance: int


@dataclass(frozen=True)
class BusinessEvent:
    event_type: str
    title: str
    description: str
    importance: int
    change_fields: tuple[str, ...]


TRACKED_FIELDS: dict[str, TrackedField] = {
    "pe_org_nr": TrackedField(1),
    "company_name": TrackedField(2),
    "co_address": TrackedField(1),
    "post_address": TrackedField(1),
    "post_nr": TrackedField(1),
    "post_ort": TrackedField(1),
    "seat_municipality_code": TrackedField(3, "seat_municipality"),
    "seat_municipality": TrackedField(1),
    "seat_county_code": TrackedField(3, "seat_county"),
    "seat_county": TrackedField(1),
    "aregion_code": TrackedField(2, "aregion"),
    "aregion": TrackedField(1),
    "num_workplaces": TrackedField(3),
    "size_class_code": TrackedField(5, "size_class"),
    "size_class": TrackedField(1),
    "company_status_code": TrackedField(5, "company_status"),
    "company_status": TrackedField(1),
    "skv_registered_code": TrackedField(3, "skv_registered"),
    "skv_registered": TrackedField(1),
    "legal_form_code": TrackedField(3, "legal_form"),
    "legal_form": TrackedField(1),
    "reklam_code": TrackedField(2, "reklam"),
    "reklam": TrackedField(1),
    "utskick_code": TrackedField(2, "utskick"),
    "utskick": TrackedField(1),
    "start_date": TrackedField(3),
    "end_date": TrackedField(5),
    "registration_date": TrackedField(3),
    "bransch_1_code": TrackedField(4, "bransch_1"),
    "bransch_1p_code": TrackedField(2),
    "bransch_1": TrackedField(1),
    "avdelning_1_code": TrackedField(3, "avdelning_1"),
    "avdelning_1": TrackedField(1),
    "export_import_mark": TrackedField(3),
    "turnover_year": TrackedField(2),
    "turnover_size_code": TrackedField(5, "turnover_size"),
    "turnover_size": TrackedField(1),
    "turnover_fin_size_code": TrackedField(4, "turnover_fin_size"),
    "turnover_fin_size": TrackedField(1),
    "owner_category_code": TrackedField(3, "owner_category"),
    "owner_category": TrackedField(1),
    "phone": TrackedField(2),
    "email": TrackedField(2),
    "private_public_code": TrackedField(2, "private_public"),
    "private_public": TrackedField(1),
    "employer_status_code": TrackedField(5, "employer_status"),
    "employer_status": TrackedField(1),
    "vat_status_code": TrackedField(4, "vat_status"),
    "vat_status": TrackedField(1),
    "f_tax_status_code": TrackedField(4, "f_tax_status"),
    "f_tax_status": TrackedField(1),
    "company_state_code": TrackedField(4, "company_state"),
    "company_state": TrackedField(1),
    "num_firms": TrackedField(2),
    "firma": TrackedField(2),
    "sector_code": TrackedField(2, "sector"),
    "sector": TrackedField(1),
    "sme_size_code": TrackedField(3, "sme_size"),
    "sme_size": TrackedField(1),
    "female_share": TrackedField(1),
    "male_share": TrackedField(1),
    "owner_country_code": TrackedField(2, "owner_country"),
    "owner_country": TrackedField(1),
    "owner_name": TrackedField(2),
    "foreign_ownership_code": TrackedField(2, "foreign_ownership"),
    "foreign_ownership": TrackedField(1),
}


def normalize_change_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return str(value)


def values_equal(left: Any, right: Any) -> bool:
    return normalize_change_value(left) == normalize_change_value(right)


def get_existing_company(conn: Connection, org_nr: str) -> dict[str, Any] | None:
    with conn.cursor() as cur:
        cur.execute("select * from company where org_nr = %(org_nr)s", {"org_nr": org_nr})
        return cur.fetchone()


def detect_changes(
    existing_row: dict[str, Any],
    new_row: dict[str, Any],
) -> list[DetectedChange]:
    changes: list[DetectedChange] = []

    for field_name, config in TRACKED_FIELDS.items():
        old_value = existing_row.get(field_name)
        new_value = new_row.get(field_name)

        if values_equal(old_value, new_value):
            continue

        old_label = existing_row.get(config.label_field) if config.label_field else None
        new_label = new_row.get(config.label_field) if config.label_field else None

        changes.append(
            DetectedChange(
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                old_label=old_label,
                new_label=new_label,
                importance=config.importance,
            )
        )

    return changes


def insert_company_changes(
    conn: Connection,
    org_nr: str,
    changes: list[DetectedChange],
    ingestion_run_id: int | None = None,
) -> dict[str, int]:
    if not changes:
        return {}

    rows = [
        {
            "org_nr": org_nr,
            "field_name": change.field_name,
            "old_value": normalize_change_value(change.old_value),
            "new_value": normalize_change_value(change.new_value),
            "old_label": normalize_change_value(change.old_label),
            "new_label": normalize_change_value(change.new_label),
            "ingestion_run_id": ingestion_run_id,
            "importance": change.importance,
        }
        for change in changes
    ]

    sql = """
        insert into company_change (
          org_nr,
          field_name,
          old_value,
          new_value,
          old_label,
          new_label,
          ingestion_run_id,
          importance
        )
        values (
          %(org_nr)s,
          %(field_name)s,
          %(old_value)s,
          %(new_value)s,
          %(old_label)s,
          %(new_label)s,
          %(ingestion_run_id)s,
          %(importance)s
        )
        returning id, field_name;
    """

    change_ids_by_field: dict[str, int] = {}
    with conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, row)
            inserted = cur.fetchone()
            change_ids_by_field[inserted["field_name"]] = inserted["id"]

    return change_ids_by_field


def int_or_none(value: Any) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def derive_business_events(
    org_nr: str,
    company_name: str | None,
    changes: list[DetectedChange],
    is_new_company: bool = False,
) -> list[BusinessEvent]:
    name = company_name or org_nr

    if is_new_company:
        return [
            BusinessEvent(
                event_type="new_company",
                title="Nytt företag i databasen",
                description=f"{name} sågs för första gången i SCB-importen.",
                importance=4,
                change_fields=(),
            )
        ]

    changes_by_field = {change.field_name: change for change in changes}
    events: list[BusinessEvent] = []

    employer = changes_by_field.get("employer_status_code")
    if employer and normalize_change_value(employer.new_value) == "1":
        events.append(
            BusinessEvent(
                event_type="became_employer",
                title="Blev registrerad arbetsgivare",
                description=f"{name} är nu registrerad som arbetsgivare.",
                importance=5,
                change_fields=("employer_status_code",),
            )
        )

    vat = changes_by_field.get("vat_status_code")
    if vat and normalize_change_value(vat.new_value) == "1":
        events.append(
            BusinessEvent(
                event_type="vat_registered",
                title="Blev momsregistrerad",
                description=f"{name} är nu registrerad för moms.",
                importance=4,
                change_fields=("vat_status_code",),
            )
        )

    f_tax = changes_by_field.get("f_tax_status_code")
    if f_tax and normalize_change_value(f_tax.new_value) == "1":
        events.append(
            BusinessEvent(
                event_type="f_tax_registered",
                title="Blev registrerad för F-skatt",
                description=f"{name} är nu registrerad för F-skatt.",
                importance=4,
                change_fields=("f_tax_status_code",),
            )
        )

    status = changes_by_field.get("company_status_code")
    if status:
        if normalize_change_value(status.new_value) == "1":
            events.append(
                BusinessEvent(
                    event_type="company_active",
                    title="Företaget blev verksamt",
                    description=f"{name} har status som verksamt företag.",
                    importance=4,
                    change_fields=("company_status_code",),
                )
            )
        else:
            events.append(
                BusinessEvent(
                    event_type="company_inactive",
                    title="Företagsstatus ändrades",
                    description=f"{name} har ändrad företagsstatus.",
                    importance=5,
                    change_fields=("company_status_code",),
                )
            )

    if "seat_municipality_code" in changes_by_field:
        events.append(
            BusinessEvent(
                event_type="changed_municipality",
                title="Bytte säteskommun",
                description=f"{name} har ändrat säteskommun.",
                importance=3,
                change_fields=("seat_municipality_code",),
            )
        )

    if "bransch_1_code" in changes_by_field:
        events.append(
            BusinessEvent(
                event_type="changed_industry",
                title="Bytte bransch",
                description=f"{name} har ändrat SNI-bransch.",
                importance=4,
                change_fields=("bransch_1_code",),
            )
        )

    size = changes_by_field.get("size_class_code")
    old_size = int_or_none(size.old_value) if size else None
    new_size = int_or_none(size.new_value) if size else None
    if old_size is not None and new_size is not None and new_size > old_size:
        events.append(
            BusinessEvent(
                event_type="size_class_increased",
                title="Storleksklass ökade",
                description=f"{name} har flyttat upp i anställdaklass.",
                importance=5,
                change_fields=("size_class_code",),
            )
        )

    turnover = changes_by_field.get("turnover_size_code")
    old_turnover = int_or_none(turnover.old_value) if turnover else None
    new_turnover = int_or_none(turnover.new_value) if turnover else None
    if (
        old_turnover is not None
        and new_turnover is not None
        and new_turnover > old_turnover
    ):
        events.append(
            BusinessEvent(
                event_type="turnover_class_increased",
                title="Omsättningsklass ökade",
                description=f"{name} har flyttat upp i omsättningsklass.",
                importance=5,
                change_fields=("turnover_size_code",),
            )
        )

    return events


def insert_business_events(
    conn: Connection,
    org_nr: str,
    events: list[BusinessEvent],
    change_ids_by_field: dict[str, int],
    ingestion_run_id: int | None = None,
) -> None:
    if not events:
        return

    sql = """
        insert into business_event (
          org_nr,
          event_type,
          title,
          description,
          ingestion_run_id,
          company_change_ids,
          importance
        )
        values (
          %(org_nr)s,
          %(event_type)s,
          %(title)s,
          %(description)s,
          %(ingestion_run_id)s,
          %(company_change_ids)s,
          %(importance)s
        );
    """

    with conn.cursor() as cur:
        for event in events:
            change_ids = [
                change_ids_by_field[field]
                for field in event.change_fields
                if field in change_ids_by_field
            ]
            cur.execute(
                sql,
                {
                    "org_nr": org_nr,
                    "event_type": event.event_type,
                    "title": event.title,
                    "description": event.description,
                    "ingestion_run_id": ingestion_run_id,
                    "company_change_ids": change_ids or None,
                    "importance": event.importance,
                },
            )


def start_ingestion_run(conn: Connection, source: str = "scb_je") -> int:
    with conn.cursor() as cur:
        cur.execute(
            "insert into ingestion_run (source) values (%(source)s) returning id",
            {"source": source},
        )
        row = cur.fetchone()
        return row["id"]


def update_ingestion_run_counts(
    conn: Connection,
    ingestion_run_id: int,
    records_seen: int = 0,
    records_new: int = 0,
    records_changed: int = 0,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            update ingestion_run
            set
              records_seen = records_seen + %(records_seen)s,
              records_new = records_new + %(records_new)s,
              records_changed = records_changed + %(records_changed)s
            where id = %(id)s
            """,
            {
                "id": ingestion_run_id,
                "records_seen": records_seen,
                "records_new": records_new,
                "records_changed": records_changed,
            },
        )


def finish_ingestion_run(
    conn: Connection,
    ingestion_run_id: int,
    status: str = "done",
    error: str | None = None,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            update ingestion_run
            set finished_at = now(), status = %(status)s, error = %(error)s
            where id = %(id)s
            """,
            {"id": ingestion_run_id, "status": status, "error": error},
        )
