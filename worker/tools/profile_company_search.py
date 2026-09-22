"""Profile representative company-search plans against the configured database.

The script is intentionally read-only. It runs the five search shapes tracked in
TODO.txt with ``EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`` and prints compact JSON
that can be compared before an index or query-plan change.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass

from api.database import get_db_connection


CASES = {
    "short_prefix": (
        """
        SELECT company_id
        FROM core.company_current
        WHERE lower(company_name) LIKE %(prefix)s
        ORDER BY lower(company_name), company_id
        LIMIT 50
        """,
        {"prefix": "ant%"},
    ),
    "alias_prefix": (
        """
        SELECT h.company_id
        FROM src_bolagsverket.organization_name n
        JOIN src_bolagsverket.organization_history h
          ON h.id = n.organization_history_id
        WHERE h.valid_to IS NULL
          AND lower(n.name) LIKE %(prefix)s
        ORDER BY lower(n.name), h.company_id
        LIMIT 50
        """,
        {"prefix": "viu%"},
    ),
    "postal_city": (
        """
        SELECT company_id
        FROM core.company_current
        WHERE postal_city ILIKE %(postal_city)s
        LIMIT 50
        """,
        {"postal_city": "%stockholm%"},
    ),
    "company_age": (
        """
        SELECT company_id
        FROM core.company_current
        WHERE COALESCE(start_date, scb_registration_date) <=
                (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Stockholm')::date
                - make_interval(years => %(age_min)s)
          AND COALESCE(start_date, scb_registration_date) >
                (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Stockholm')::date
                - make_interval(years => %(age_max_plus_one)s)
        LIMIT 50
        """,
        {"age_min": 1, "age_max_plus_one": 11},
    ),
    "combined_filters": (
        """
        SELECT company_id
        FROM core.company_current
        WHERE activity_status_code = '1'
          AND seat_county_code = %(county_code)s
          AND turnover_class_code = ANY(%(turnover_codes)s)
          AND primary_industry_code IS NOT NULL
          AND seat_municipality_code NOT IN ('0000', '9999')
        ORDER BY company_name ASC NULLS LAST, company_id
        LIMIT 50
        """,
        {"county_code": "18", "turnover_codes": ["4", "5"]},
    ),
}

@dataclass(frozen=True)
class Measurement:
    case: str
    planning_ms: float
    execution_ms: float
    estimated_rows: int
    actual_rows: int
    shared_hit_blocks: int
    shared_read_blocks: int
    indexes: list[str]


def _indexes(node: dict) -> set[str]:
    found = {node["Index Name"]} if node.get("Index Name") else set()
    for child in node.get("Plans", []):
        found.update(_indexes(child))
    return found


def main() -> None:
    measurements: list[Measurement] = []
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM core.company_current")
        company_rows = cur.fetchone()["total"]
        for name, (query, params) in CASES.items():
            cur.execute("SET LOCAL statement_timeout = '60000ms'")
            cur.execute(
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + query,
                params,
            )
            explain = cur.fetchone()["QUERY PLAN"][0]
            plan = explain["Plan"]
            measurements.append(
                Measurement(
                    case=name,
                    planning_ms=round(explain["Planning Time"], 3),
                    execution_ms=round(explain["Execution Time"], 3),
                    estimated_rows=plan["Plan Rows"],
                    actual_rows=plan["Actual Rows"],
                    shared_hit_blocks=plan.get("Shared Hit Blocks", 0),
                    shared_read_blocks=plan.get("Shared Read Blocks", 0),
                    indexes=sorted(_indexes(plan)),
                )
            )
        conn.rollback()

    print(
        json.dumps(
            {
                "company_rows": company_rows,
                "measurements": [asdict(item) for item in measurements],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
