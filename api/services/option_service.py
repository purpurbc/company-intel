from ..database import get_db_connection

def get_counties():
    sql = """
    SELECT code, name
    FROM app.dim_county
    WHERE code NOT IN ('00', '99')
    ORDER BY code;
    """
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def get_municipalities(county_code: str):
    sql = """
    SELECT code, name, county_code
    FROM app.dim_municipality
    WHERE county_code = %(county_code)s
      AND code NOT IN ('0000', '9999')
    ORDER BY code;
    """
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"county_code": county_code})
        return cur.fetchall()

def count_municipalities():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) AS total FROM app.dim_municipality "
            "WHERE code NOT IN ('0000', '9999');"
        )
        return cur.fetchone()["total"]

def count_counties():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) AS total FROM app.dim_county "
            "WHERE code NOT IN ('00', '99');"
        )
        return cur.fetchone()["total"]
