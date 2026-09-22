import json
from functools import lru_cache
from pathlib import Path

from ..database import get_db_connection
from .data_quality_service import get_overview_metadata
from .overview_cache import get_overview_cache, set_overview_cache


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


def _code_labels(cur, domains):
    cur.execute(
        """
        SELECT DISTINCT ON (domain, code) domain, code, name
        FROM meta.code
        WHERE domain = ANY(%(domains)s)
        ORDER BY domain, code,
            CASE source WHEN 'scb_api' THEN 0 WHEN 'scb_bulk' THEN 1 ELSE 2 END;
        """,
        {"domains": list(domains)},
    )
    return {
        (row["domain"], row["code"]): row["name"] for row in cur.fetchall()
    }


def get_county_overview(county_code: str):
    if not county_code or county_code in {"00", "99"}:
        return None

    scope = f"county:v3:{county_code}"
    cached = get_overview_cache(scope)
    if cached:
        return cached

    overview = _calculate_county_overview(county_code)
    if overview:
        set_overview_cache(scope, overview)
    return overview


def _calculate_county_overview(county_code: str):
    # One grouping-set query replaces eight scans of the same county. This is
    # especially important for Västra Götaland and the other large counties.
    overview_sql = """
    WITH scoped AS MATERIALIZED (
        SELECT
            s.seat_municipality_code AS municipality_code,
            s.region_code,
            COALESCE(left(s.primary_industry_code, 2), '00') AS industry_code,
            COALESCE(s.employee_size_code, 'unknown') AS size_code,
            COALESCE(s.turnover_class_code, 'unknown') AS turnover_code,
            COALESCE(s.activity_status_code, 'unknown') AS status_code,
            COALESCE(s.company_state_code, 'unknown') AS state_code,
            s.activity_status_code,
            s.employer_status_code,
            s.primary_industry_code,
            s.company_state_code
        FROM core.company_current s
        WHERE s.seat_county_code = %(county_code)s
    )
    SELECT
        CASE
            WHEN GROUPING(municipality_code) = 0 THEN 'municipality'
            WHEN GROUPING(region_code) = 0 THEN 'aregion'
            WHEN GROUPING(industry_code) = 0 THEN 'industry'
            WHEN GROUPING(size_code) = 0 THEN 'size'
            WHEN GROUPING(turnover_code) = 0 THEN 'turnover'
            WHEN GROUPING(status_code) = 0 THEN 'activity_status'
            WHEN GROUPING(state_code) = 0 THEN 'company_state'
            ELSE 'totals'
        END AS dimension,
        CASE
            WHEN GROUPING(municipality_code) = 0 THEN municipality_code
            WHEN GROUPING(region_code) = 0 THEN region_code
            WHEN GROUPING(industry_code) = 0 THEN industry_code
            WHEN GROUPING(size_code) = 0 THEN size_code
            WHEN GROUPING(turnover_code) = 0 THEN turnover_code
            WHEN GROUPING(status_code) = 0 THEN status_code
            WHEN GROUPING(state_code) = 0 THEN state_code
        END AS code,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE activity_status_code = '1') AS active,
        COUNT(*) FILTER (WHERE employer_status_code = '1') AS employers,
        COUNT(DISTINCT municipality_code) FILTER (
            WHERE municipality_code NOT IN ('0000', '9999')
        ) AS municipalities,
        COUNT(DISTINCT region_code) AS aregions,
        COUNT(activity_status_code) AS activity_status_covered,
        COUNT(employer_status_code) AS employer_status_covered,
        COUNT(*) FILTER (
            WHERE municipality_code IS NOT NULL
              AND municipality_code NOT IN ('0000', '9999')
        ) AS municipality_covered,
        COUNT(region_code) AS aregion_covered,
        COUNT(primary_industry_code) AS industry_covered,
        COUNT(company_state_code) AS company_state_covered,
        COUNT(*) FILTER (
            WHERE municipality_code IN ('0000', '9999')
        ) AS technical_municipality_rows,
        COUNT(*) FILTER (WHERE municipality_code IS NULL) AS missing_municipality_rows
    FROM scoped
    GROUP BY GROUPING SETS (
        (),
        (municipality_code),
        (region_code),
        (industry_code),
        (size_code),
        (turnover_code),
        (status_code),
        (state_code)
    )
    ORDER BY dimension, count DESC, code ASC NULLS LAST;
    """

    params = {"county_code": county_code}

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(overview_sql, params)
        rows = cur.fetchall()
        totals_row = next(
            (row for row in rows if row["dimension"] == "totals"),
            None,
        )
        if not totals_row or totals_row["count"] == 0:
            return None

        label_domains = {
            "municipality": "seat_municipality_code",
            "aregion": "region_code",
            "size": "employee_size_code",
            "turnover": "turnover_class_code",
            "activity_status": "activity_status_code",
            "company_state": "company_state_code",
        }
        code_labels = _code_labels(
            cur,
            {"seat_county_code", *label_domains.values()},
        )

        def dimension_rows(dimension):
            result = []
            for row in rows:
                if row["dimension"] != dimension:
                    continue
                if (
                    dimension == "municipality"
                    and row["code"] in {"0000", "9999"}
                ):
                    continue
                code = row["code"]
                fallback = "Saknas" if code in {None, "unknown", "00"} else "Okänd"
                name = code_labels.get((label_domains.get(dimension), code), fallback)
                result.append({"code": code, "name": name, "count": row["count"]})
            return result

        municipality_rows = dimension_rows("municipality")
        aregion_rows = dimension_rows("aregion")
        industry_rows = dimension_rows("industry")
        size_rows = dimension_rows("size")
        turnover_rows = dimension_rows("turnover")
        status_rows = dimension_rows("activity_status")
        state_rows = dimension_rows("company_state")

        metadata = get_overview_metadata(
            cur,
            total=totals_row["count"],
            coverage_counts={
                "companies": totals_row["count"],
                "active": totals_row["activity_status_covered"],
                "employers": totals_row["employer_status_covered"],
                "municipalities": totals_row["municipality_covered"],
                "aregions": totals_row["aregion_covered"],
                "industry": totals_row["industry_covered"],
                "activity_status": totals_row["activity_status_covered"],
                "company_state": totals_row["company_state_covered"],
            },
            technical_geography={
                "municipality_rows": totals_row["technical_municipality_rows"],
                "missing_municipality_rows": totals_row["missing_municipality_rows"],
            },
        )

    return {
        "county_code": county_code,
        "county_name": code_labels.get(
            ("seat_county_code", county_code),
            county_code,
        ),
        "totals": {
            "companies": totals_row["count"],
            "active": totals_row["active"],
            "employers": totals_row["employers"],
            "municipalities": totals_row["municipalities"],
            "aregions": totals_row["aregions"],
        },
        "metadata": metadata,
        "by_municipality": municipality_rows,
        "by_aregion": aregion_rows,
        "by_industry": _apply_labels(industry_rows, _industry_group_labels()),
        "by_size": size_rows,
        "by_turnover": turnover_rows,
        "by_activity_status": status_rows,
        "by_company_state": state_rows,
    }


def get_municipality_overview(municipality_code: str):
    if not municipality_code or municipality_code in {"0000", "9999"}:
        return None

    scope = f"municipality:v3:{municipality_code}"
    cached = get_overview_cache(scope)
    if cached:
        return cached

    overview = _calculate_municipality_overview(municipality_code)
    if overview:
        set_overview_cache(scope, overview)
    return overview


def _calculate_municipality_overview(municipality_code: str):
    municipality_sql = """
    SELECT
        municipality_code,
        municipality_name,
        county_code,
        county_name
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    LIMIT 1;
    """

    totals_sql = """
    SELECT
        COUNT(*) AS companies,
        COUNT(*) FILTER (
            WHERE activity_status_code = '1'
        ) AS active,
        COUNT(*) FILTER (
            WHERE employer_status_code = '1'
        ) AS employers,
        COUNT(DISTINCT region_code) AS aregions,
        COUNT(DISTINCT primary_industry_code) AS industries,
        COUNT(activity_status_code) AS activity_status_covered,
        COUNT(employer_status_code) AS employer_status_covered,
        COUNT(region_code) AS aregion_covered,
        COUNT(primary_industry_code) AS industry_covered,
        COUNT(company_state_code) AS company_state_covered
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s;
    """

    industry_sql = """
    SELECT
        COALESCE(left(primary_industry_code, 2), '00') AS code,
        NULL::text AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY COALESCE(left(primary_industry_code, 2), '00')
    ORDER BY count DESC, code ASC;
    """

    size_sql = """
    SELECT
        COALESCE(employee_size_code, 'unknown') AS code,
        COALESCE(MAX(employee_size), 'Saknas') AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY COALESCE(employee_size_code, 'unknown')
    ORDER BY count DESC, name ASC;
    """

    turnover_sql = """
    SELECT
        COALESCE(turnover_size_code, 'unknown') AS code,
        COALESCE(MAX(turnover_size), 'Saknas') AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY COALESCE(turnover_size_code, 'unknown')
    ORDER BY count DESC, name ASC;
    """

    aregion_sql = """
    SELECT
        region_code AS code,
        region_name AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY region_code, region_name
    ORDER BY count DESC, name ASC;
    """

    status_sql = """
    SELECT
        COALESCE(activity_status_code, 'unknown') AS code,
        COALESCE(MAX(activity_status), 'Saknas') AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY COALESCE(activity_status_code, 'unknown')
    ORDER BY count DESC, name ASC;
    """

    state_sql = """
    SELECT
        COALESCE(company_state_code, 'unknown') AS code,
        COALESCE(MAX(company_state), 'Saknas') AS name,
        COUNT(*) AS count
    FROM app.company_list
    WHERE municipality_code = %(municipality_code)s
    GROUP BY COALESCE(company_state_code, 'unknown')
    ORDER BY count DESC, name ASC;
    """

    params = {"municipality_code": municipality_code}

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(municipality_sql, params)
        municipality_row = cur.fetchone()

        if not municipality_row:
            return None

        cur.execute(totals_sql, params)
        totals_row = cur.fetchone()

        cur.execute(industry_sql, params)
        industry_rows = cur.fetchall()

        cur.execute(size_sql, params)
        size_rows = cur.fetchall()

        cur.execute(turnover_sql, params)
        turnover_rows = cur.fetchall()

        cur.execute(aregion_sql, params)
        aregion_rows = cur.fetchall()

        cur.execute(status_sql, params)
        status_rows = cur.fetchall()

        cur.execute(state_sql, params)
        state_rows = cur.fetchall()

        metadata = get_overview_metadata(
            cur,
            total=totals_row["companies"],
            coverage_counts={
                "companies": totals_row["companies"],
                "active": totals_row["activity_status_covered"],
                "employers": totals_row["employer_status_covered"],
                "aregions": totals_row["aregion_covered"],
                "industries": totals_row["industry_covered"],
                "activity_status": totals_row["activity_status_covered"],
                "company_state": totals_row["company_state_covered"],
            },
        )

    return {
        "municipality_code": municipality_code,
        "municipality_name": municipality_row["municipality_name"],
        "county_code": municipality_row["county_code"],
        "county_name": municipality_row["county_name"],
        "totals": {
            "companies": totals_row["companies"],
            "active": totals_row["active"],
            "employers": totals_row["employers"],
            "aregions": totals_row["aregions"],
            "industries": totals_row["industries"],
        },
        "metadata": metadata,
        "by_industry": _apply_labels(industry_rows, _industry_group_labels()),
        "by_size": size_rows,
        "by_turnover": turnover_rows,
        "by_aregion": aregion_rows,
        "by_activity_status": status_rows,
        "by_company_state": state_rows,
    }
