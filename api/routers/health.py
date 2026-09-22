from fastapi import APIRouter, HTTPException

from ..database import get_db_connection
from ..config import APP_ENV
from ..schemas import DatabaseHealthResponse, HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health():
    return {"ok": True, "event_contract_version": 2}


@router.get("/health/db", response_model=DatabaseHealthResponse)
def database_health():
    required_objects = [
        'meta.schema_migration', 'meta.ingestion_run', 'meta.data_quality_issue',
        'core.company', 'core.company_identifier',
        'core.company_state_history', 'core.company_current', 'core.company_industry',
        'raw.company_record', 'src_scb.company_history', 'src_bolagsverket.organization_history',
        'app.company', 'app.company_registration', 'app.company_event',
        'app.saved_segment', 'app.app_user',
        'app.overview_cache',
    ]

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok;")
                cur.fetchone()

                cur.execute(
                    """
                    SELECT object_name
                    FROM unnest(%(objects)s::text[]) AS object_name
                    WHERE to_regclass(object_name) IS NULL
                    ORDER BY object_name;
                    """,
                    {"objects": required_objects},
                )
                missing = [row["object_name"] for row in cur.fetchall()]
                cur.execute(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'app'
                      AND table_name = 'overview_cache'
                      AND column_name = ANY(%(columns)s::text[]);
                    """,
                    {"columns": ["generated_at", "expires_at"]},
                )
                cache_columns = {row["column_name"] for row in cur.fetchall()}
                missing.extend(
                    f"app.overview_cache.{column}"
                    for column in ("generated_at", "expires_at")
                    if column not in cache_columns
                )
    except Exception as exc:
        detail = {"ok": False, "database": "connection_failed"}
        if APP_ENV != "production":
            detail["error_type"] = exc.__class__.__name__
            detail["error"] = str(exc)

        raise HTTPException(
            status_code=503,
            detail=detail,
        ) from exc

    if missing:
        raise HTTPException(
            status_code=503,
            detail={"ok": False, "database": "missing_objects", "missing": missing},
        )

    return {"ok": True, "database": "ready", "event_contract_version": 2}
