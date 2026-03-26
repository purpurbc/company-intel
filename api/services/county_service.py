from ..database import get_db_connection

def get_county_overview(county_code: str):
    county_sql = """
    SELECT
        seat_county_code,
        seat_county_name AS county_name
    FROM v_company
    WHERE seat_county_code = %(county_code)s
    LIMIT 1;
    """

    totals_sql = """
    SELECT
        COUNT(*) AS companies,
        COUNT(*) FILTER (
            WHERE company_status_code = '1'
        ) AS active,
        COUNT(*) FILTER (
            WHERE employer_status_code = '1'
        ) AS employers,
        COUNT(DISTINCT seat_municipality_code) AS municipalities,
        COUNT(DISTINCT aregion_code) AS aregions
    FROM v_company
    WHERE seat_county_code = %(county_code)s;
    """

    municipality_sql = """
    SELECT
        seat_municipality_code AS code,
        seat_municipality_name AS name,
        COUNT(*) AS count
    FROM v_company
    WHERE seat_county_code = %(county_code)s
    GROUP BY seat_municipality_code, seat_municipality_name
    ORDER BY count DESC, name ASC;
    """

    aregion_sql = """
    SELECT
        aregion_code AS code,
        aregion_name AS name,
        COUNT(*) AS count
    FROM v_company
    WHERE seat_county_code = %(county_code)s
    GROUP BY aregion_code, aregion_name
    ORDER BY count DESC, name ASC;
    """

    params = {"county_code": county_code}

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(county_sql, params)
        county_row = cur.fetchone()

        if not county_row:
            return {"error": "not_found"}

        cur.execute(totals_sql, params)
        totals_row = cur.fetchone()

        cur.execute(municipality_sql, params)
        municipality_rows = cur.fetchall()

        cur.execute(aregion_sql, params)
        aregion_rows = cur.fetchall()

    return {
        "county_code": county_code,
        "county_name": county_row["county_name"],
        "totals": {
            "companies": totals_row["companies"],
            "active": totals_row["active"],
            "employers": totals_row["employers"],
            "municipalities": totals_row["municipalities"],
            "aregions": totals_row["aregions"],
        },
        "by_municipality": municipality_rows,
        "by_aregion": aregion_rows,
    }