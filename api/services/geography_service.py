from ..database import get_db_connection
from .overview_cache import get_overview_cache, set_overview_cache


GEOGRAPHY_COUNTS_SQL = """
    SELECT dimension, code, count
    FROM (
        SELECT
            CASE
                WHEN GROUPING(seat_municipality_code) = 1 THEN 'county'
                ELSE 'municipality'
            END AS dimension,
            CASE
                WHEN GROUPING(seat_municipality_code) = 1 THEN seat_county_code
                ELSE seat_municipality_code
            END AS code,
            COUNT(*) AS count
        FROM core.company_current
        GROUP BY GROUPING SETS (
            (seat_county_code),
            (seat_municipality_code)
        )
    ) counts
    WHERE (dimension = 'county' AND code IS NOT NULL AND code NOT IN ('00', '99'))
       OR (
            dimension = 'municipality'
            AND code IS NOT NULL
            AND code NOT IN ('0000', '9999')
       )
    ORDER BY dimension, code;
"""


def get_geography_counts(*, connection_factory=None):
    """Return lightweight company totals for county and municipality indexes."""
    cache_key = "geography-index-counts:v1"
    cached = get_overview_cache(
        cache_key,
        connection_factory=connection_factory,
    )
    if cached:
        return cached

    connect = connection_factory or get_db_connection
    with connect() as conn, conn.cursor() as cur:
        cur.execute(GEOGRAPHY_COUNTS_SQL)
        rows = cur.fetchall()

    result = {"counties": [], "municipalities": []}
    for row in rows:
        target = "counties" if row["dimension"] == "county" else "municipalities"
        result[target].append(
            {"code": row["code"], "name": None, "count": row["count"]}
        )

    set_overview_cache(
        cache_key,
        result,
        connection_factory=connection_factory,
    )
    return result
