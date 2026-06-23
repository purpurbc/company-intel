import argparse
import os
from pathlib import Path
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None


if load_dotenv:
    load_dotenv()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Copy selected company rows from one Postgres database to another.",
    )
    parser.add_argument(
        "--org-nr",
        action="append",
        default=[],
        help="Company org_nr to copy. Can be passed multiple times.",
    )
    parser.add_argument(
        "--org-file",
        help="Text file with one org_nr per line. Empty lines and # comments are ignored.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit after combining --org-nr and --org-file.",
    )
    parser.add_argument(
        "--source-url",
        default=os.getenv("SOURCE_DATABASE_URL")
        or os.getenv("LOCAL_DATABASE_URL")
        or os.getenv("DATABASE_URL"),
        help="Source database URL. Defaults to SOURCE_DATABASE_URL, LOCAL_DATABASE_URL, then DATABASE_URL.",
    )
    parser.add_argument(
        "--target-url",
        default=os.getenv("TARGET_DATABASE_URL")
        or os.getenv("SUPABASE_DATABASE_URL")
        or os.getenv("REMOTE_DATABASE_URL"),
        help="Target database URL. Defaults to TARGET_DATABASE_URL, SUPABASE_DATABASE_URL, then REMOTE_DATABASE_URL.",
    )
    return parser.parse_args()


def read_org_numbers(args: argparse.Namespace) -> list[str]:
    org_numbers = [normalise_org_nr(value) for value in args.org_nr]

    if args.org_file:
        path = Path(args.org_file)
        for line in path.read_text(encoding="utf-8").splitlines():
            value = line.strip()
            if not value or value.startswith("#"):
                continue
            org_numbers.append(normalise_org_nr(value))

    deduped = list(dict.fromkeys(value for value in org_numbers if value))
    return deduped[: args.limit] if args.limit else deduped


def normalise_org_nr(value: str) -> str:
    return value.strip().replace("-", "").replace(" ", "")


def describe_url(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.hostname or "unknown-host"
    database = parsed.path.lstrip("/") or "unknown-db"
    user = parsed.username or "unknown-user"
    return f"{user}@{host}/{database}"


def fetch_companies(source_url: str, org_numbers: list[str]) -> tuple[list[dict], list[str]]:
    with psycopg.connect(source_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM company
                WHERE org_nr = ANY(%(org_numbers)s::text[])
                ORDER BY org_nr;
                """,
                {"org_numbers": org_numbers},
            )
            rows = cur.fetchall()

    found = {row["org_nr"] for row in rows}
    missing = [org_nr for org_nr in org_numbers if org_nr not in found]
    return rows, missing


def upsert_companies(target_url: str, rows: list[dict]) -> None:
    if not rows:
        return

    rows = [prepare_company_row(row) for row in rows]

    columns = list(rows[0].keys())
    insert_cols = ", ".join(columns)
    insert_vals = ", ".join([f"%({column})s" for column in columns])
    update_set = ", ".join(
        [f"{column} = EXCLUDED.{column}" for column in columns if column != "org_nr"]
    )

    sql = f"""
        INSERT INTO company ({insert_cols})
        VALUES ({insert_vals})
        ON CONFLICT (org_nr)
        DO UPDATE SET
        {update_set};
    """

    with psycopg.connect(target_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
        conn.commit()


def prepare_company_row(row: dict) -> dict:
    prepared = dict(row)

    for key in ("source_payload",):
        value = prepared.get(key)
        if isinstance(value, (dict, list)):
            prepared[key] = Jsonb(value)

    return prepared


def main() -> None:
    args = parse_args()
    org_numbers = read_org_numbers(args)

    if not org_numbers:
        raise SystemExit("No org numbers provided. Use --org-nr or --org-file.")
    if not args.source_url:
        raise SystemExit("Missing source DB URL. Set SOURCE_DATABASE_URL or pass --source-url.")
    if not args.target_url:
        raise SystemExit("Missing target DB URL. Set TARGET_DATABASE_URL or pass --target-url.")

    print(f"Source: {describe_url(args.source_url)}")
    print(f"Target: {describe_url(args.target_url)}")
    print(f"Requested org numbers: {len(org_numbers)}")

    rows, missing = fetch_companies(args.source_url, org_numbers)
    print(f"Found in source: {len(rows)}")

    if missing:
        print("Missing in source:")
        for org_nr in missing:
            print(f"  - {org_nr}")

    upsert_companies(args.target_url, rows)
    print(f"Copied to target: {len(rows)}")


if __name__ == "__main__":
    main()
