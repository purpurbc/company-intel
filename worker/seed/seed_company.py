from worker.scb.models.company import CompanyJE  

from dataclasses import asdict
from psycopg import Connection
import json

def seed_company(conn : Connection, company : CompanyJE):
    row = asdict(company)

    # Extra metadata
    row["source_payload"] = json.dumps(row, default=str)
    row["scb_updated_at"] = None

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