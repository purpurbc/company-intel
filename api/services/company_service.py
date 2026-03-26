from ..database import get_db_connection

def get_companies(
    q: str | None,
    search_by: str,
    county_code: str | None,
    municipality_code: str | None,
    limit: int,
    offset: int,
):
    where = []
    params = {"limit": limit, "offset": offset}

    if q:
        q = q.strip()

        if search_by == "company_name":
            where.append("company_name ILIKE %(q_like)s")
            params["q_like"] = f"%{q}%"

        elif search_by == "org_nr":
            where.append("org_nr = %(q_exact)s")
            params["q_exact"] = q

        elif search_by == "seat_municipality_name":
            where.append("seat_municipality_name ILIKE %(q_like)s")
            params["q_like"] = f"%{q}%"

        else:
            where.append(
                "(company_name ILIKE %(q_like)s OR org_nr = %(q_exact)s OR seat_municipality_name ILIKE %(q_like)s)"
            )
            params["q_like"] = f"%{q}%"
            params["q_exact"] = q

    if county_code:
        where.append("seat_county_code = %(county_code)s")
        params["county_code"] = county_code

    if municipality_code:
        where.append("seat_municipality_code = %(municipality_code)s")
        params["municipality_code"] = municipality_code

    where_sql = "WHERE " + " AND ".join(where) if where else ""

    count_sql = f"""
    SELECT count(*) AS total
    FROM v_company
    {where_sql};
    """

    data_sql = f"""
    SELECT *
    FROM v_company
    {where_sql}
    ORDER BY company_name
    LIMIT %(limit)s OFFSET %(offset)s;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(count_sql, params)
        total = cur.fetchone()["total"]

        cur.execute(data_sql, params)
        rows = cur.fetchall()

    return {"items": rows, "total": total, "limit": limit, "offset": offset}


def get_company_by_orgnr(org_nr: str):
    sql = "SELECT * FROM v_company_full WHERE org_nr = %(org_nr)s;"
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"org_nr": org_nr})
        return cur.fetchone()