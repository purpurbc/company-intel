from uuid import UUID

from psycopg.errors import UndefinedTable
from psycopg.types.json import Jsonb

from ..database import get_db_connection
from .saved_segment_service import DEFAULT_USER_ID


def get_app_user(user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      u.id,
      u.auth_provider,
      u.auth_subject,
      u.email,
      u.display_name,
      u.role,
      u.company_org_nr,
      c.company_name,
      c.post_ort,
      c.seat_county_code,
      COALESCE(dc.name, c.seat_county) AS seat_county_name,
      c.seat_municipality_code,
      COALESCE(dm.name, c.seat_municipality) AS seat_municipality_name,
      u.company_description,
      u.ideal_customer_description,
      u.settings,
      u.created_at,
      u.updated_at
    FROM app_user u
    LEFT JOIN company c ON c.org_nr = u.company_org_nr
    LEFT JOIN dim_county dc ON dc.code = c.seat_county_code
    LEFT JOIN dim_municipality dm ON dm.code = c.seat_municipality_code
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
            "company_name": None,
            "post_ort": None,
            "seat_county_code": None,
            "seat_county_name": None,
            "seat_municipality_code": None,
            "seat_municipality_name": None,
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
      company_org_nr,
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
      %(company_org_nr)s,
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
      company_org_nr = EXCLUDED.company_org_nr,
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
        cur.execute(sql, params)
        conn.commit()

    return get_app_user(user_id=user_id)


def list_sales_offers(user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      o.id,
      o.user_id,
      o.name,
      o.description,
      o.target,
      o.saved_segment_id,
      s.name AS saved_segment_name,
      COALESCE(
        array_remove(array_agg(oc.customer_id ORDER BY ca.updated_at DESC), NULL),
        '{}'::uuid[]
      ) AS customer_ids,
      o.created_at,
      o.updated_at
    FROM sales_offer o
    LEFT JOIN saved_segment s ON s.id = o.saved_segment_id
    LEFT JOIN sales_offer_customer oc ON oc.offer_id = o.id
    LEFT JOIN customer_account ca ON ca.id = oc.customer_id
    WHERE o.user_id = %(user_id)s
    GROUP BY o.id, s.name
    ORDER BY o.updated_at DESC, o.name ASC;
    """

    try:
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, {"user_id": user_id})
            return cur.fetchall()
    except UndefinedTable:
        return []


def create_sales_offer(payload: dict, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    INSERT INTO sales_offer (
      user_id,
      name,
      description,
      target,
      saved_segment_id
    )
    VALUES (
      %(user_id)s,
      %(name)s,
      %(description)s,
      %(target)s,
      %(saved_segment_id)s
    )
    RETURNING *;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            {
                "user_id": user_id,
                "name": payload["name"],
                "description": payload.get("description"),
                "target": payload.get("target"),
                "saved_segment_id": payload.get("saved_segment_id"),
            },
        )
        offer = cur.fetchone()
        _replace_offer_customers(
            cur,
            offer["id"],
            payload.get("customer_ids") or [],
            user_id,
        )
        conn.commit()

    return get_sales_offer(offer["id"], user_id=user_id)


def update_sales_offer(
    offer_id: UUID,
    payload: dict,
    user_id: UUID = DEFAULT_USER_ID,
):
    sql = """
    UPDATE sales_offer
    SET
      name = %(name)s,
      description = %(description)s,
      target = %(target)s,
      saved_segment_id = %(saved_segment_id)s,
      updated_at = now()
    WHERE id = %(offer_id)s AND user_id = %(user_id)s
    RETURNING *;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            {
                "offer_id": offer_id,
                "user_id": user_id,
                "name": payload["name"],
                "description": payload.get("description"),
                "target": payload.get("target"),
                "saved_segment_id": payload.get("saved_segment_id"),
            },
        )
        offer = cur.fetchone()
        if not offer:
            conn.rollback()
            return None

        _replace_offer_customers(
            cur,
            offer_id,
            payload.get("customer_ids") or [],
            user_id,
        )
        conn.commit()

    return get_sales_offer(offer_id, user_id=user_id)


def get_sales_offer(offer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      o.id,
      o.user_id,
      o.name,
      o.description,
      o.target,
      o.saved_segment_id,
      s.name AS saved_segment_name,
      COALESCE(
        array_remove(array_agg(oc.customer_id ORDER BY ca.updated_at DESC), NULL),
        '{}'::uuid[]
      ) AS customer_ids,
      o.created_at,
      o.updated_at
    FROM sales_offer o
    LEFT JOIN saved_segment s ON s.id = o.saved_segment_id
    LEFT JOIN sales_offer_customer oc ON oc.offer_id = o.id
    LEFT JOIN customer_account ca ON ca.id = oc.customer_id
    WHERE o.id = %(offer_id)s AND o.user_id = %(user_id)s
    GROUP BY o.id, s.name;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"offer_id": offer_id, "user_id": user_id})
        return cur.fetchone()


def delete_sales_offer(offer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    DELETE FROM sales_offer
    WHERE id = %(offer_id)s AND user_id = %(user_id)s
    RETURNING id;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"offer_id": offer_id, "user_id": user_id})
        conn.commit()
        return cur.fetchone()


def _replace_offer_customers(
    cur,
    offer_id: UUID,
    customer_ids: list[UUID],
    user_id: UUID,
):
    cur.execute(
        "DELETE FROM sales_offer_customer WHERE offer_id = %(offer_id)s;",
        {"offer_id": offer_id},
    )

    for customer_id in customer_ids:
        cur.execute(
            """
            INSERT INTO sales_offer_customer (offer_id, customer_id)
            SELECT %(offer_id)s, %(customer_id)s
            FROM customer_account
            WHERE id = %(customer_id)s AND user_id = %(user_id)s
            ON CONFLICT DO NOTHING;
            """,
            {
                "offer_id": offer_id,
                "customer_id": customer_id,
                "user_id": user_id,
            },
        )


def _replace_customer_offers(
    cur,
    customer_id: UUID,
    offer_ids: list[UUID],
    user_id: UUID,
):
    cur.execute(
        "DELETE FROM sales_offer_customer WHERE customer_id = %(customer_id)s;",
        {"customer_id": customer_id},
    )

    for offer_id in offer_ids:
        cur.execute(
            """
            INSERT INTO sales_offer_customer (offer_id, customer_id)
            SELECT %(offer_id)s, %(customer_id)s
            FROM sales_offer
            WHERE id = %(offer_id)s AND user_id = %(user_id)s
            ON CONFLICT DO NOTHING;
            """,
            {
                "offer_id": offer_id,
                "customer_id": customer_id,
                "user_id": user_id,
            },
        )


def list_customer_accounts(user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      ca.id,
      ca.user_id,
      ca.org_nr,
      c.company_name,
      c.post_ort,
      c.seat_county_code,
      COALESCE(dc.name, c.seat_county) AS seat_county_name,
      c.seat_municipality_code,
      COALESCE(dm.name, c.seat_municipality) AS seat_municipality_name,
      ca.customer_labels,
      ca.connection_text,
      ca.why_fit,
      ca.pain_points,
      ca.buying_trigger,
      ca.outcome,
      ca.tags,
      ca.fit_score,
      COALESCE(
        array_remove(array_agg(o.id ORDER BY o.updated_at DESC), NULL),
        '{}'::uuid[]
      ) AS offer_ids,
      COALESCE(
        array_remove(array_agg(o.name ORDER BY o.updated_at DESC), NULL),
        '{}'::text[]
      ) AS offer_names,
      ca.created_at,
      ca.updated_at
    FROM customer_account ca
    JOIN company c ON c.org_nr = ca.org_nr
    LEFT JOIN dim_county dc ON dc.code = c.seat_county_code
    LEFT JOIN dim_municipality dm ON dm.code = c.seat_municipality_code
    LEFT JOIN sales_offer_customer soc ON soc.customer_id = ca.id
    LEFT JOIN sales_offer o ON o.id = soc.offer_id AND o.user_id = ca.user_id
    WHERE ca.user_id = %(user_id)s
    GROUP BY ca.id, c.org_nr, c.company_name, dc.name, dm.name
    ORDER BY ca.updated_at DESC, c.company_name ASC;
    """

    try:
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, {"user_id": user_id})
            return cur.fetchall()
    except UndefinedTable:
        return []


def create_customer_account(payload: dict, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    INSERT INTO customer_account (
      user_id,
      org_nr,
      customer_labels,
      connection_text,
      why_fit,
      pain_points,
      buying_trigger,
      outcome,
      tags,
      fit_score
    )
    VALUES (
      %(user_id)s,
      %(org_nr)s,
      %(customer_labels)s,
      %(connection_text)s,
      %(why_fit)s,
      %(pain_points)s,
      %(buying_trigger)s,
      %(outcome)s,
      %(tags)s,
      %(fit_score)s
    )
    ON CONFLICT (user_id, org_nr) DO UPDATE
    SET
      customer_labels = EXCLUDED.customer_labels,
      connection_text = EXCLUDED.connection_text,
      why_fit = EXCLUDED.why_fit,
      pain_points = EXCLUDED.pain_points,
      buying_trigger = EXCLUDED.buying_trigger,
      outcome = EXCLUDED.outcome,
      tags = EXCLUDED.tags,
      fit_score = EXCLUDED.fit_score,
      updated_at = now()
    RETURNING id;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            {
                "user_id": user_id,
                "org_nr": payload["org_nr"],
                "customer_labels": Jsonb(payload.get("customer_labels") or []),
                "connection_text": payload.get("connection_text"),
                "why_fit": payload.get("why_fit"),
                "pain_points": payload.get("pain_points"),
                "buying_trigger": payload.get("buying_trigger"),
                "outcome": payload.get("outcome"),
                "tags": Jsonb(payload.get("tags") or []),
                "fit_score": payload.get("fit_score") or 0,
            },
        )
        row = cur.fetchone()
        _replace_customer_offers(
            cur,
            row["id"],
            payload.get("offer_ids") or [],
            user_id,
        )
        conn.commit()

    return get_customer_account(row["id"], user_id=user_id)


def update_customer_account(
    customer_id: UUID,
    payload: dict,
    user_id: UUID = DEFAULT_USER_ID,
):
    sql = """
    UPDATE customer_account
    SET
      org_nr = %(org_nr)s,
      customer_labels = %(customer_labels)s,
      connection_text = %(connection_text)s,
      why_fit = %(why_fit)s,
      pain_points = %(pain_points)s,
      buying_trigger = %(buying_trigger)s,
      outcome = %(outcome)s,
      tags = %(tags)s,
      fit_score = %(fit_score)s,
      updated_at = now()
    WHERE id = %(customer_id)s AND user_id = %(user_id)s
    RETURNING id;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            {
                "customer_id": customer_id,
                "user_id": user_id,
                "org_nr": payload["org_nr"],
                "customer_labels": Jsonb(payload.get("customer_labels") or []),
                "connection_text": payload.get("connection_text"),
                "why_fit": payload.get("why_fit"),
                "pain_points": payload.get("pain_points"),
                "buying_trigger": payload.get("buying_trigger"),
                "outcome": payload.get("outcome"),
                "tags": Jsonb(payload.get("tags") or []),
                "fit_score": payload.get("fit_score") or 0,
            },
        )
        row = cur.fetchone()
        if row:
            _replace_customer_offers(
                cur,
                row["id"],
                payload.get("offer_ids") or [],
                user_id,
            )
        conn.commit()

    return get_customer_account(row["id"], user_id=user_id) if row else None


def get_customer_account(customer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    SELECT
      ca.id,
      ca.user_id,
      ca.org_nr,
      c.company_name,
      c.post_ort,
      c.seat_county_code,
      COALESCE(dc.name, c.seat_county) AS seat_county_name,
      c.seat_municipality_code,
      COALESCE(dm.name, c.seat_municipality) AS seat_municipality_name,
      ca.customer_labels,
      ca.connection_text,
      ca.why_fit,
      ca.pain_points,
      ca.buying_trigger,
      ca.outcome,
      ca.tags,
      ca.fit_score,
      COALESCE(
        array_remove(array_agg(o.id ORDER BY o.updated_at DESC), NULL),
        '{}'::uuid[]
      ) AS offer_ids,
      COALESCE(
        array_remove(array_agg(o.name ORDER BY o.updated_at DESC), NULL),
        '{}'::text[]
      ) AS offer_names,
      ca.created_at,
      ca.updated_at
    FROM customer_account ca
    JOIN company c ON c.org_nr = ca.org_nr
    LEFT JOIN dim_county dc ON dc.code = c.seat_county_code
    LEFT JOIN dim_municipality dm ON dm.code = c.seat_municipality_code
    LEFT JOIN sales_offer_customer soc ON soc.customer_id = ca.id
    LEFT JOIN sales_offer o ON o.id = soc.offer_id AND o.user_id = ca.user_id
    WHERE ca.id = %(customer_id)s AND ca.user_id = %(user_id)s
    GROUP BY ca.id, c.org_nr, c.company_name, dc.name, dm.name
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"customer_id": customer_id, "user_id": user_id})
        return cur.fetchone()


def delete_customer_account(customer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    sql = """
    DELETE FROM customer_account
    WHERE id = %(customer_id)s AND user_id = %(user_id)s
    RETURNING id;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"customer_id": customer_id, "user_id": user_id})
        conn.commit()
        return cur.fetchone()
