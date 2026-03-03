from fastapi import FastAPI, Query
from .database import get_db_connection
from .config import ALLOWED_ORIGIN

app = FastAPI(title="Company Intel API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/companies")
def companies(
        q: str | None = Query(default=None),
        county_code: str | None = None,
        municipality_code: str | None = None,
        limit: int = Query(default=50, ge=1, le=200),
        offset: int = Query(default=0, ge=0),
    ):
    where = []
    params = {"limit": limit, "offset": offset}

    if q:
        where.append("(company_name ILIKE %(q_like)s OR org_nr = %(q_exact)s)")
        params["q_like"] = f"%{q}%"
        params["q_exact"] = q

    if county_code:
        where.append("seat_county_code = %(county_code)s")
        params["county_code"] = county_code

    if municipality_code:
        where.append("seat_municipality_code = %(municipality_code)s")
        params["municipality_code"] = municipality_code

    where_sql = "WHERE " + " AND ".join(where) if where else ""

    sql = f"""
    SELECT *
    FROM v_company
    {where_sql}
    ORDER BY company_name
    LIMIT %(limit)s OFFSET %(offset)s;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
    
    total = None
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(f"SELECT count(*) AS total FROM v_company {where_sql};", params)
        total = cur.fetchone()["total"]

        cur.execute(sql, params)
        rows = cur.fetchall()

    return {"items": rows, "total": total, "limit": limit, "offset": offset}

@app.get("/company/{org_nr}")
def company(org_nr: str):
    sql = "SELECT * FROM v_company_full WHERE org_nr = %(org_nr)s;"
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"org_nr": org_nr})
        row = cur.fetchone()
    if not row:
        return {"error": "not_found"}
    return row

@app.get("/options/counties")
def options_counties():
    sql = "SELECT code, name FROM dim_county ORDER BY code;"
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()
    return rows

@app.get("/options/municipalities")
def options_municipalities(county_code: str | None = None):
    sql = """
    SELECT code, name, county_code
    FROM dim_municipality
    WHERE county_code = %(county_code)s
    ORDER BY code;
    """
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(sql, {"county_code": county_code})
        rows = cur.fetchall()
    return rows

@app.get("/nof/municipalities")
def number_of_municipalities():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM dim_municipality;")
        total = cur.fetchone()["total"]
    return total

@app.get("/nof/counties")
def number_of_counties():
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM dim_county;")
        total = cur.fetchone()["total"]
    return total