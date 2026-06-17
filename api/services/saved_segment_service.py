from uuid import UUID

from psycopg.errors import UndefinedTable
from psycopg.types.json import Jsonb

from ..database import get_db_connection
from .company_service import get_companies


DEFAULT_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def _string_list(value):
    return [item for item in value or [] if isinstance(item, str)]


def _int_or_none(value):
    return value if isinstance(value, int) else None


def list_saved_segments(user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      id,
      user_id,
      name,
      description,
      filters,
      sort,
      visibility,
      intent,
      notes,
      match_profile_id,
      source,
      result_count,
      last_result_count_at,
      last_used_at,
      created_at,
      updated_at
    FROM saved_segment
    WHERE user_id = %(user_id)s
    ORDER BY updated_at DESC, name ASC;
    """

    try:
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, {"user_id": user_id})
            return cur.fetchall()
    except UndefinedTable:
        return []


def create_saved_segment(payload: dict, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    INSERT INTO saved_segment (
      user_id,
      name,
      description,
      filters,
      sort,
      visibility,
      intent,
      notes,
      match_profile_id,
      source,
      result_count,
      last_result_count_at
    )
    VALUES (
      %(user_id)s,
      %(name)s,
      %(description)s,
      %(filters)s,
      %(sort)s,
      %(visibility)s,
      %(intent)s,
      %(notes)s,
      %(match_profile_id)s,
      %(source)s,
      %(result_count)s,
      CASE WHEN %(result_count)s IS NULL THEN NULL ELSE now() END
    )
    RETURNING *;
    """
    params = {
        "user_id": user_id,
        "name": payload["name"],
        "description": payload.get("description"),
        "filters": Jsonb(payload.get("filters") or {}),
        "sort": Jsonb(payload.get("sort") or {}),
        "visibility": payload.get("visibility") or "private",
        "intent": payload.get("intent"),
        "notes": payload.get("notes"),
        "match_profile_id": payload.get("match_profile_id"),
        "source": payload.get("source") or "manual",
        "result_count": payload.get("result_count"),
    }

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        conn.commit()
        return cur.fetchone()


def update_saved_segment(
    segment_id: UUID,
    payload: dict,
    user_id: UUID = DEFAULT_USER_ID,
):
    sql = """
    UPDATE saved_segment
    SET
      name = %(name)s,
      description = %(description)s,
      filters = %(filters)s,
      sort = %(sort)s,
      visibility = %(visibility)s,
      intent = %(intent)s,
      notes = %(notes)s,
      match_profile_id = %(match_profile_id)s,
      source = %(source)s,
      result_count = %(result_count)s,
      last_result_count_at = CASE
        WHEN %(result_count)s IS NULL THEN last_result_count_at
        ELSE now()
      END,
      updated_at = now()
    WHERE id = %(segment_id)s AND user_id = %(user_id)s
    RETURNING *;
    """
    params = {
        "segment_id": segment_id,
        "user_id": user_id,
        "name": payload["name"],
        "description": payload.get("description"),
        "filters": Jsonb(payload.get("filters") or {}),
        "sort": Jsonb(payload.get("sort") or {}),
        "visibility": payload.get("visibility") or "private",
        "intent": payload.get("intent"),
        "notes": payload.get("notes"),
        "match_profile_id": payload.get("match_profile_id"),
        "source": payload.get("source") or "manual",
        "result_count": payload.get("result_count"),
    }

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        conn.commit()
        return cur.fetchone()


def refresh_saved_segment_count(
    segment_id: UUID,
    user_id: UUID = DEFAULT_USER_ID,
):
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, filters
            FROM saved_segment
            WHERE id = %(segment_id)s AND user_id = %(user_id)s;
            """,
            {"segment_id": segment_id, "user_id": user_id},
        )
        segment = cur.fetchone()

    if not segment:
        return None

    filters = segment.get("filters") or {}
    result = get_companies(
        q=filters.get("q") if isinstance(filters.get("q"), str) else None,
        search_by=filters.get("search_by")
        if filters.get("search_by") in {"all", "company_name", "org_nr"}
        else "all",
        county_codes=_string_list(filters.get("county_codes")),
        municipality_codes=_string_list(filters.get("municipality_codes")),
        company_status_codes=_string_list(filters.get("company_status_codes")),
        company_state_codes=_string_list(filters.get("company_state_codes")),
        employer_status_codes=_string_list(filters.get("employer_status_codes")),
        vat_status_codes=_string_list(filters.get("vat_status_codes")),
        f_tax_status_codes=_string_list(filters.get("f_tax_status_codes")),
        marketing_status_codes=_string_list(filters.get("marketing_status_codes")),
        size_class_codes=_string_list(filters.get("size_class_codes")),
        age_min=_int_or_none(filters.get("age_min")),
        age_max=_int_or_none(filters.get("age_max")),
        post_ort=filters.get("post_ort")
        if isinstance(filters.get("post_ort"), str)
        else None,
        post_nr=filters.get("post_nr")
        if isinstance(filters.get("post_nr"), str)
        else None,
        owner_category_codes=_string_list(filters.get("owner_category_codes")),
        sme_size_codes=_string_list(filters.get("sme_size_codes")),
        export_import_marks=_string_list(filters.get("export_import_marks")),
        section_codes=_string_list(filters.get("section_codes")),
        industry_codes=_string_list(filters.get("industry_codes")),
        industry_detail_codes=_string_list(filters.get("industry_detail_codes")),
        turnover_size_codes=_string_list(filters.get("turnover_size_codes")),
        name_sort="asc",
        metric_sort="none",
        limit=1,
        offset=0,
    )

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE saved_segment
            SET
              result_count = %(result_count)s,
              last_result_count_at = now(),
              updated_at = now()
            WHERE id = %(segment_id)s AND user_id = %(user_id)s
            RETURNING *;
            """,
            {
                "segment_id": segment_id,
                "user_id": user_id,
                "result_count": result["total"],
            },
        )
        conn.commit()
        return cur.fetchone()


def delete_saved_segment(segment_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    DELETE FROM saved_segment
    WHERE id = %(segment_id)s AND user_id = %(user_id)s
    RETURNING id;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"segment_id": segment_id, "user_id": user_id})
        conn.commit()
        return cur.fetchone()


def touch_saved_segment(segment_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    UPDATE saved_segment
    SET last_used_at = now(), updated_at = now()
    WHERE id = %(segment_id)s AND user_id = %(user_id)s
    RETURNING *;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"segment_id": segment_id, "user_id": user_id})
        conn.commit()
        return cur.fetchone()
