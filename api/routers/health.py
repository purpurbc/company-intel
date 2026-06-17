from fastapi import APIRouter, HTTPException

from ..database import get_db_connection
from ..config import APP_ENV

router = APIRouter()

@router.get("/health")
def health():
    return {"ok": True}


@router.get("/health/db")
def database_health():
    required_objects = [
        "company",
        "v_company",
        "v_company_full",
        "dim_county",
        "dim_municipality",
        "saved_segment",
        "app_user",
        "sales_offer",
        "customer_account",
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

    return {"ok": True, "database": "ready"}
