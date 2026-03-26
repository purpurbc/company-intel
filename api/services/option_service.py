from ..database import get_db_connection

def get_counties():
    sql = "SELECT code, name FROM dim_county ORDER BY code;"
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def get_municipalities(county_code: str):
    sql = """
    SELECT code, name, county_code
    FROM dim_municipality
    WHERE county_code = %(county_code)s
    ORDER BY code;
    """
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"county_code": county_code})
        return cur.fetchall()

def count_municipalities():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM dim_municipality;")
        return cur.fetchone()["total"]

def count_counties():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM dim_county;")
        return cur.fetchone()["total"]