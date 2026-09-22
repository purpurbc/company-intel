from uuid import UUID

from psycopg.errors import UndefinedTable
from psycopg.types.json import Jsonb

from ..database import get_db_connection
from .company_identity import resolve_company_id
from .saved_segment_service import DEFAULT_USER_ID


PROFILE_COMPANY_SQL = """
    SELECT
      s.company_id,
      entity.entity_type AS company_entity_type,
      CASE
        WHEN k.identity_type = 'ORGNR' THEN k.identity_value
        WHEN k.identity_type IN ('PERSON', 'PERSON_SHORT') THEN right(k.identity_value, 10)
        ELSE k.identity_value
      END AS org_nr,
      CASE
        WHEN k.identity_type = 'ORGNR' THEN '16' || k.identity_value
        WHEN k.identity_type = 'PERSON' THEN k.identity_value
        ELSE NULL::text
      END AS pe_org_nr,
      s.company_name,
      s.registered_name AS company_registered_name,
      s.postal_city,
      s.seat_county_code AS county_code,
      s.labels->>'seat_county_code' AS county_name,
      s.seat_municipality_code AS municipality_code,
      s.labels->>'seat_municipality_code' AS municipality_name
    FROM core.company_current s
    JOIN core.company entity USING (company_id)
    JOIN core.company_identifier k USING (company_id)
"""


def get_app_user(user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      u.id,
      u.auth_provider,
      u.auth_subject,
      u.email,
      u.display_name,
      u.role,
      u.company_id,
      c.company_entity_type,
      c.org_nr AS company_org_nr,
      c.pe_org_nr AS company_pe_org_nr,
      c.company_name,
      c.company_registered_name,
      c.postal_city,
      c.county_code,
      COALESCE(dc.name, c.county_name) AS county_name,
      c.municipality_code,
      COALESCE(dm.name, c.municipality_name) AS municipality_name,
      u.company_description,
      u.ideal_customer_description,
      u.settings,
      u.created_at,
      u.updated_at
    FROM app_user u
    LEFT JOIN LATERAL (
      """ + PROFILE_COMPANY_SQL + """
      WHERE s.company_id = u.company_id
    ) c ON true
    LEFT JOIN dim_county dc ON dc.code = c.county_code
    LEFT JOIN dim_municipality dm ON dm.code = c.municipality_code
    WHERE u.id = %(user_id)s;
    """

    try:
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, {"user_id": user_id})
            user = cur.fetchone()
            if user:
                return user

            cur.execute(
                """
                INSERT INTO app_user (id, display_name, role)
                VALUES (%(user_id)s, 'MVP User', 'user')
                ON CONFLICT (id) DO NOTHING;
                """,
                {"user_id": user_id},
            )
            conn.commit()
    except UndefinedTable:
        return {
            "id": user_id,
            "auth_provider": None,
            "auth_subject": None,
            "email": None,
            "display_name": "MVP User",
            "role": "user",
            "company_org_nr": None,
            "company_entity_type": None,
            "company_name": None,
            "company_registered_name": None,
            "postal_city": None,
            "county_code": None,
            "county_name": None,
            "municipality_code": None,
            "municipality_name": None,
            "company_description": None,
            "ideal_customer_description": None,
            "settings": {},
            "created_at": None,
            "updated_at": None,
        }

    return get_app_user(user_id=user_id)


def update_app_user(payload: dict, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    INSERT INTO app_user (
      id,
      auth_provider,
      auth_subject,
      email,
      display_name,
      role,
      company_id,
      company_description,
      ideal_customer_description,
      settings
    )
    VALUES (
      %(user_id)s,
      %(auth_provider)s,
      %(auth_subject)s,
      %(email)s,
      %(display_name)s,
      %(role)s,
      %(company_id)s,
      %(company_description)s,
      %(ideal_customer_description)s,
      %(settings)s
    )
    ON CONFLICT (id) DO UPDATE
    SET
      auth_provider = EXCLUDED.auth_provider,
      auth_subject = EXCLUDED.auth_subject,
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      company_id = EXCLUDED.company_id,
      company_description = EXCLUDED.company_description,
      ideal_customer_description = EXCLUDED.ideal_customer_description,
      settings = EXCLUDED.settings,
      updated_at = now();
    """
    params = {
        "user_id": user_id,
        "auth_provider": payload.get("auth_provider"),
        "auth_subject": payload.get("auth_subject"),
        "email": payload.get("email"),
        "display_name": payload.get("display_name") or "MVP User",
        "role": payload.get("role") or "user",
        "company_org_nr": payload.get("company_org_nr") or None,
        "company_description": payload.get("company_description"),
        "ideal_customer_description": payload.get("ideal_customer_description"),
        "settings": Jsonb(payload.get("settings") or {}),
    }

    with get_db_connection() as conn, conn.cursor() as cur:
        company_org_nr = params["company_org_nr"]
        requested_company_id = payload.get("company_id")
        params["company_id"] = (
            resolve_company_id(
                cur,
                company_org_nr,
                company_id=requested_company_id,
            )
            if company_org_nr or requested_company_id is not None
            else None
        )
        cur.execute(sql, params)
        conn.commit()

    return get_app_user(user_id=user_id)
