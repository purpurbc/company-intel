import json
from functools import lru_cache
from pathlib import Path
from threading import Lock

from ..database import get_db_connection
from .data_quality_service import get_overview_metadata
from .overview_cache import get_overview_cache, set_overview_cache


COMPANY_STATUS_LABELS = {
    "0": "Har aldrig varit verksam",
    "1": "Är verksam",
    "9": "Är ej längre verksam",
}

BREAKDOWN_LABEL_DOMAINS = {
    "county": "seat_county_code",
    "municipality": "seat_municipality_code",
    "section": "industry_section_code",
    "size": "employee_size_code",
    "turnover": "turnover_class_code",
    "activity_status": "activity_status_code",
    "company_state": "company_state_code",
    "employer_status": "employer_status_code",
    "vat_status": "vat_status_code",
    "f_tax_status": "f_tax_status_code",
    "marketing": "advertising_status_code",
}
SWEDEN_OVERVIEW_CACHE_KEY = "sweden:v6"
_sweden_overview_lock = Lock()

VAT_AND_F_TAX_SQL = """
        COUNT(*) FILTER (
            WHERE vat_status_code = '1' AND f_tax_status_code = '1'
        )
""".strip()


@lru_cache(maxsize=1)
def _industry_group_labels():
    path = (
        Path(__file__).resolve().parents[2]
        / "worker"
        / "scb"
        / "data"
        / "Je"
        / "Kodtabell"
        / "Je_Kodtabell_2-siffrig bransch 1.json"
    )
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    return {
        row["Varde"]: row["Text"]
        for row in payload.get("VardeLista", [])
        if row.get("Varde")
    }


def _apply_labels(rows, labels, fallback="Okänd"):
    return [
        {
            **row,
            "name": row.get("name") or labels.get(row.get("code"), fallback),
        }
        for row in rows
    ]


def _breakdown_labels(cur) -> dict[tuple[str, str], str]:
    """Load canonical labels once, after aggregating only compact code values."""
    cur.execute(
        """
        SELECT DISTINCT ON (domain, code) domain, code, name
        FROM meta.code
        WHERE domain = ANY(%(domains)s)
        ORDER BY domain, code,
            CASE source
                WHEN 'scb_api' THEN 0
                WHEN 'scb_bulk' THEN 1
                WHEN 'bolagsverket' THEN 2
                ELSE 3
            END;
        """,
        {"domains": list(BREAKDOWN_LABEL_DOMAINS.values())},
    )
    return {
        (row["domain"], row["code"]): row["name"]
        for row in cur.fetchall()
    }


def get_sweden_overview(*, connection_factory=None):
    cached = get_overview_cache(
        SWEDEN_OVERVIEW_CACHE_KEY,
        connection_factory=connection_factory,
    )
    if cached:
        return cached

    # Recheck inside the lock so concurrent first-page requests do not launch
    # identical national aggregates after an import invalidates the cache.
    with _sweden_overview_lock:
        cached = get_overview_cache(
            SWEDEN_OVERVIEW_CACHE_KEY,
            connection_factory=connection_factory,
        )
        if cached:
            return cached

        overview = _calculate_sweden_overview(
            connection_factory=connection_factory,
        )
        set_overview_cache(
            SWEDEN_OVERVIEW_CACHE_KEY,
            overview,
            connection_factory=connection_factory,
        )
        return overview


def _calculate_sweden_overview(*, connection_factory=None):
    totals_sql = f"""
    SELECT
        COUNT(*) AS companies,
        COUNT(*) FILTER (WHERE activity_status_code = '1') AS active,
        COUNT(*) FILTER (WHERE activity_status_code = '9') AS inactive,
        COUNT(*) FILTER (WHERE activity_status_code = '0') AS never_active,
        COUNT(*) FILTER (WHERE employer_status_code = '1') AS employers,
        COUNT(*) FILTER (WHERE vat_status_code = '1') AS vat_registered,
        COUNT(*) FILTER (WHERE f_tax_status_code = '1') AS f_tax_registered,
        {VAT_AND_F_TAX_SQL} AS vat_and_f_tax,
        COUNT(*) FILTER (WHERE advertising_status_code IN ('11', '12', '13')) AS accepts_marketing,
        COUNT(DISTINCT seat_county_code) FILTER (
            WHERE seat_county_code NOT IN ('00', '99')
        ) AS counties,
        COUNT(DISTINCT seat_municipality_code) FILTER (
            WHERE seat_municipality_code NOT IN ('0000', '9999')
        ) AS municipalities,
        COUNT(DISTINCT left(primary_industry_code, 2)) AS industry_groups,
        COUNT(activity_status_code) AS activity_status_covered,
        COUNT(employer_status_code) AS employer_status_covered,
        COUNT(*) FILTER (
            WHERE vat_status_code IS NOT NULL AND f_tax_status_code IS NOT NULL
        ) AS tax_status_covered,
        COUNT(*) FILTER (
            WHERE seat_county_code IS NOT NULL
              AND seat_county_code NOT IN ('00', '99')
        ) AS county_covered,
        COUNT(*) FILTER (
            WHERE seat_municipality_code IS NOT NULL
              AND seat_municipality_code NOT IN ('0000', '9999')
        ) AS municipality_covered,
        COUNT(primary_industry_code) AS industry_covered,
        COUNT(company_state_code) AS company_state_covered,
        COUNT(*) FILTER (
            WHERE seat_county_code IN ('00', '99')
        ) AS technical_county_rows,
        COUNT(*) FILTER (
            WHERE seat_municipality_code IN ('0000', '9999')
        ) AS technical_municipality_rows,
        COUNT(*) FILTER (WHERE seat_county_code IS NULL) AS missing_county_rows,
        COUNT(*) FILTER (
            WHERE seat_municipality_code IS NULL
        ) AS missing_municipality_rows
    FROM core.company_current;
    """

    # One GROUPING SETS query produces every chart breakdown during a single
    # scan of the compact current-state table. Keep additions here so a new
    # breakdown does not silently add another full-table query.
    breakdowns_sql = """
    SELECT dimension, code, name, count
    FROM (
        SELECT
            CASE
                WHEN GROUPING(seat_county_code) = 0 THEN 'county'
                WHEN GROUPING(seat_municipality_code) = 0 THEN 'municipality'
                WHEN GROUPING(COALESCE(left(primary_industry_code, 2), '00')) = 0 THEN 'industry'
                WHEN GROUPING(industry_section_code) = 0 THEN 'section'
                WHEN GROUPING(employee_size_code) = 0 THEN 'size'
                WHEN GROUPING(turnover_class_code) = 0 THEN 'turnover'
                WHEN GROUPING(activity_status_code) = 0 THEN 'activity_status'
                WHEN GROUPING(company_state_code) = 0 THEN 'company_state'
                WHEN GROUPING(employer_status_code) = 0 THEN 'employer_status'
                WHEN GROUPING(vat_status_code) = 0 THEN 'vat_status'
                WHEN GROUPING(f_tax_status_code) = 0 THEN 'f_tax_status'
                ELSE 'marketing'
            END AS dimension,
            CASE
                WHEN GROUPING(seat_county_code) = 0 THEN seat_county_code
                WHEN GROUPING(seat_municipality_code) = 0 THEN seat_municipality_code
                WHEN GROUPING(COALESCE(left(primary_industry_code, 2), '00')) = 0
                    THEN COALESCE(left(primary_industry_code, 2), '00')
                WHEN GROUPING(industry_section_code) = 0 THEN industry_section_code
                WHEN GROUPING(employee_size_code) = 0 THEN employee_size_code
                WHEN GROUPING(turnover_class_code) = 0 THEN turnover_class_code
                WHEN GROUPING(activity_status_code) = 0 THEN activity_status_code
                WHEN GROUPING(company_state_code) = 0 THEN company_state_code
                WHEN GROUPING(employer_status_code) = 0 THEN employer_status_code
                WHEN GROUPING(vat_status_code) = 0 THEN vat_status_code
                WHEN GROUPING(f_tax_status_code) = 0 THEN f_tax_status_code
                ELSE advertising_status_code
            END AS code,
            NULL::text AS name,
            COUNT(*) AS count
        FROM core.company_current
        GROUP BY GROUPING SETS (
            (seat_county_code),
            (seat_municipality_code),
            (COALESCE(left(primary_industry_code, 2), '00')),
            (industry_section_code),
            (employee_size_code),
            (turnover_class_code),
            (activity_status_code),
            (company_state_code),
            (employer_status_code),
            (vat_status_code),
            (f_tax_status_code),
            (advertising_status_code)
        )
    ) breakdown
    WHERE (dimension <> 'county' OR (code IS NOT NULL AND code NOT IN ('00', '99')))
      AND (dimension <> 'municipality' OR (code IS NOT NULL AND code NOT IN ('0000', '9999')))
    ;
    """

    connect = connection_factory or get_db_connection
    with connect() as conn, conn.cursor() as cur:
        # Cold-cache work is bounded to compact code columns. Two workers keep
        # first load practical without letting concurrent requests monopolize
        # the database; normal page loads return the persisted cache directly.
        cur.execute("SET LOCAL max_parallel_workers_per_gather = 2")
        cur.execute(totals_sql)
        totals_row = cur.fetchone()

        cur.execute(breakdowns_sql)
        breakdown_rows = cur.fetchall()
        labels = _breakdown_labels(cur)
        breakdowns = {}
        for row in breakdown_rows:
            dimension = row.pop("dimension")
            domain = BREAKDOWN_LABEL_DOMAINS.get(dimension)
            if domain and row.get("code") is not None:
                row["name"] = labels.get((domain, row["code"]))
            breakdowns.setdefault(dimension, []).append(row)

        metadata = get_overview_metadata(
            cur,
            total=totals_row["companies"],
            coverage_counts={
                "companies": totals_row["companies"],
                "active": totals_row["activity_status_covered"],
                "employers": totals_row["employer_status_covered"],
                "vat_and_f_tax": totals_row["tax_status_covered"],
                "counties": totals_row["county_covered"],
                "municipalities": totals_row["municipality_covered"],
                "industry_groups": totals_row["industry_covered"],
                "activity_status": totals_row["activity_status_covered"],
                "company_state": totals_row["company_state_covered"],
            },
            technical_geography={
                "county_rows": totals_row["technical_county_rows"],
                "municipality_rows": totals_row["technical_municipality_rows"],
                "missing_county_rows": totals_row["missing_county_rows"],
                "missing_municipality_rows": totals_row["missing_municipality_rows"],
            },
        )

    def by_count_desc(dimension):
        return sorted(
            breakdowns.get(dimension, []),
            key=lambda row: (-row["count"], row.get("name") or ""),
        )

    def by_numeric_code(dimension):
        return sorted(
            breakdowns.get(dimension, []),
            key=lambda row: (
                int(row["code"]) if (row.get("code") or "").isdigit() else 999,
                row.get("name") or "",
            ),
        )

    county_rows = by_count_desc("county")
    municipality_rows = by_count_desc("municipality")[:25]
    industry_rows = by_count_desc("industry")
    section_rows = by_count_desc("section")
    size_rows = by_numeric_code("size")
    turnover_rows = by_numeric_code("turnover")
    status_rows = by_count_desc("activity_status")
    state_rows = by_count_desc("company_state")
    employer_status_rows = by_count_desc("employer_status")
    vat_status_rows = by_count_desc("vat_status")
    f_tax_status_rows = by_count_desc("f_tax_status")
    marketing_rows = by_count_desc("marketing")

    return {
        "scope": "sweden",
        "totals": {
            "companies": totals_row["companies"],
            "active": totals_row["active"],
            "inactive": totals_row["inactive"],
            "never_active": totals_row["never_active"],
            "employers": totals_row["employers"],
            "vat_registered": totals_row["vat_registered"],
            "f_tax_registered": totals_row["f_tax_registered"],
            "vat_and_f_tax": totals_row["vat_and_f_tax"],
            "accepts_marketing": totals_row["accepts_marketing"],
            "counties": totals_row["counties"],
            "municipalities": totals_row["municipalities"],
            "industry_groups": totals_row["industry_groups"],
        },
        "metadata": metadata,
        "by_county": county_rows,
        "by_municipality": municipality_rows,
        "by_industry": _apply_labels(industry_rows, _industry_group_labels()),
        "by_section": section_rows,
        "by_size": size_rows,
        "by_turnover": turnover_rows,
        "by_activity_status": _apply_labels(status_rows, COMPANY_STATUS_LABELS),
        "by_company_state": state_rows,
        "by_employer_status": employer_status_rows,
        "by_vat_status": vat_status_rows,
        "by_f_tax_status": f_tax_status_rows,
        "by_marketing": marketing_rows,
    }
