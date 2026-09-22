from datetime import datetime, timedelta, timezone

from psycopg.errors import UndefinedTable
from psycopg.types.json import Jsonb

from ..config import OVERVIEW_CACHE_TTL_SECONDS
from ..database import get_db_connection


def get_overview_cache(scope: str, *, connection_factory=None):
    connect = connection_factory or get_db_connection
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT payload
                FROM app.overview_cache
                WHERE scope = %(scope)s
                  AND expires_at > current_timestamp;
                """,
                {"scope": scope},
            )
            row = cur.fetchone()
            return row["payload"] if row else None
    except UndefinedTable:
        return None


def set_overview_cache(
    scope: str,
    payload: dict,
    *,
    ttl_seconds: int = OVERVIEW_CACHE_TTL_SECONDS,
    connection_factory=None,
):
    if ttl_seconds < 1:
        raise ValueError("ttl_seconds must be positive")

    generated_at = datetime.now(timezone.utc)
    expires_at = generated_at + timedelta(seconds=ttl_seconds)
    connect = connection_factory or get_db_connection
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app.overview_cache (
                    scope, payload, generated_at, expires_at
                )
                VALUES (
                    %(scope)s, %(payload)s, %(generated_at)s, %(expires_at)s
                )
                ON CONFLICT (scope) DO UPDATE
                SET payload = EXCLUDED.payload,
                    generated_at = EXCLUDED.generated_at,
                    expires_at = EXCLUDED.expires_at;
                """,
                {
                    "scope": scope,
                    "payload": Jsonb(payload),
                    "generated_at": generated_at,
                    "expires_at": expires_at,
                },
            )
            conn.commit()
    except UndefinedTable:
        pass
