from ..database import get_db_connection

def get_companies(
    q: str | None,
    search_by: str,
    county_codes: list[str] | None,
    municipality_codes: list[str] | None,
    size_class_codes: list[str] | None,
    industry_codes: list[str] | None,
    limit: int,
    offset: int,
):
    where = []
    params = {"limit": limit, "offset": offset}

    county_codes = county_codes or []
    municipality_codes = municipality_codes or []
    size_class_codes = size_class_codes or []
    industry_codes = industry_codes or []

    if q:
        q = q.strip()

        if search_by == "company_name":
            where.append("company_name ILIKE %(q_like)s")
            params["q_like"] = f"%{q}%"

        elif search_by == "org_nr":
            where.append("org_nr = %(q_exact)s")
            params["q_exact"] = q

        else:
            where.append(
                "(company_name ILIKE %(q_like)s OR org_nr = %(q_exact)s)"
            )
            params["q_like"] = f"%{q}%"
            params["q_exact"] = q

    if county_codes:
        where.append("seat_county_code = ANY(%(county_codes)s)")
        params["county_codes"] = county_codes

    if municipality_codes:
        where.append("seat_municipality_code = ANY(%(municipality_codes)s)")
        params["municipality_codes"] = municipality_codes

    if size_class_codes:
        where.append("size_class_code = ANY(%(size_class_codes)s)")
        params["size_class_codes"] = size_class_codes

    if industry_codes:
        where.append("industry_code = ANY(%(industry_codes)s)")
        params["industry_codes"] = industry_codes

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

    return {
        "items": rows,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

def get_company_by_orgnr(org_nr: str):
    sql = "SELECT * FROM v_company_full WHERE org_nr = %(org_nr)s;"
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"org_nr": org_nr})
        return cur.fetchone()