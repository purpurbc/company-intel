from worker.scb.models.company import CompanyJE  
from worker.seed.company_history import (
    derive_business_events,
    detect_changes,
    get_existing_company,
    insert_business_events,
    insert_company_changes,
)

from dataclasses import asdict
from psycopg import Connection
import json

def upsert_company_status_dimension(conn: Connection, row: dict):
    if not row.get("company_status_code") or not row.get("company_status"):
        return

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dim_company_status(code, name)
            VALUES (%(company_status_code)s, %(company_status)s)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
            """,
            row,
        )


def seed_company(
    conn: Connection,
    company: CompanyJE,
    ingestion_run_id: int | None = None,
) -> dict[str, int | bool]:
    row = asdict(company)

    # Extra metadata
    row["source_payload"] = json.dumps(row, default=str)
    row["scb_updated_at"] = None

    existing = get_existing_company(conn, row["org_nr"])
    changes = detect_changes(existing, row) if existing else []
    upsert_company_status_dimension(conn, row)

    columns = list(row.keys())

    insert_cols = ", ".join(columns)
    insert_vals = ", ".join([f"%({c})s" for c in columns])

    update_set = ", ".join(
        [f"{c} = EXCLUDED.{c}" for c in columns if c != "org_nr"]
    )

    sql = f"""
        INSERT INTO company ({insert_cols})
        VALUES ({insert_vals})
        ON CONFLICT (org_nr)
        DO UPDATE SET
        {update_set},
        ingested_at = now();
    """

    with conn.cursor() as cur:
        cur.execute(sql, row)

    if existing:
        change_ids_by_field = insert_company_changes(
            conn,
            row["org_nr"],
            changes,
            ingestion_run_id=ingestion_run_id,
        )
        events = derive_business_events(
            row["org_nr"],
            row.get("company_name"),
            changes,
            is_new_company=False,
        )
        insert_business_events(
            conn,
            row["org_nr"],
            events,
            change_ids_by_field,
            ingestion_run_id=ingestion_run_id,
        )
    else:
        events = derive_business_events(
            row["org_nr"],
            row.get("company_name"),
            [],
            is_new_company=True,
        )
        insert_business_events(
            conn,
            row["org_nr"],
            events,
            {},
            ingestion_run_id=ingestion_run_id,
        )

    return {
        "is_new": existing is None,
        "has_changes": bool(changes),
        "changes": len(changes),
        "events": len(events),
    }
