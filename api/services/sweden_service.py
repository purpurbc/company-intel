import json
from functools import lru_cache
from pathlib import Path

from ..database import get_db_connection


COMPANY_STATUS_LABELS = {
    "0": "Har aldrig varit verksam",
    "1": "Är verksam",
    "9": "Är ej längre verksam",
}


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


def get_sweden_overview():
    totals_sql = """
    SELECT
        COUNT(*) AS companies,
        COUNT(*) FILTER (WHERE company_status_code = '1') AS active,
        COUNT(*) FILTER (WHERE company_status_code = '9') AS inactive,
        COUNT(*) FILTER (WHERE company_status_code = '0') AS never_active,
        COUNT(*) FILTER (WHERE employer_status_code = '1') AS employers,
        COUNT(*) FILTER (WHERE vat_status_code = '1') AS vat_registered,
        COUNT(*) FILTER (WHERE f_tax_status_code = '1') AS f_tax_registered,
        COUNT(*) FILTER (WHERE reklam_code IN ('11', '12', '13')) AS accepts_marketing,
        COUNT(DISTINCT seat_county_code) AS counties,
        COUNT(DISTINCT seat_municipality_code) AS municipalities,
        COUNT(DISTINCT left(bransch_1_code, 2)) AS industry_groups
    FROM v_company_full;
    """

    county_sql = """
    SELECT
        seat_county_code AS code,
        seat_county_name AS name,
        COUNT(*) AS count
    FROM v_company_full
    WHERE seat_county_code IS NOT NULL
    GROUP BY seat_county_code, seat_county_name
    ORDER BY count DESC, name ASC;
    """

    municipality_sql = """
    SELECT
        seat_municipality_code AS code,
        seat_municipality_name AS name,
        COUNT(*) AS count
    FROM v_company_full
    WHERE seat_municipality_code IS NOT NULL
    GROUP BY seat_municipality_code, seat_municipality_name
    ORDER BY count DESC, name ASC
    LIMIT 25;
    """

    industry_sql = """
    SELECT
        COALESCE(left(bransch_1_code, 2), '00') AS code,
        NULL::text AS name,
        COUNT(*) AS count
    FROM company
    GROUP BY COALESCE(left(bransch_1_code, 2), '00')
    ORDER BY count DESC, code ASC;
    """

    section_sql = """
    SELECT
        avdelning_1_code AS code,
        avdelning_1 AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY avdelning_1_code, avdelning_1
    ORDER BY count DESC, name ASC;
    """

    size_sql = """
    SELECT
        size_class_code AS code,
        size_class_name_dim AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY size_class_code, size_class_name_dim
    ORDER BY
      CASE size_class_code
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '3' THEN 3
        WHEN '4' THEN 4
        WHEN '5' THEN 5
        WHEN '6' THEN 6
        WHEN '7' THEN 7
        WHEN '8' THEN 8
        WHEN '9' THEN 9
        WHEN '10' THEN 10
        WHEN '11' THEN 11
        WHEN '12' THEN 12
        WHEN '13' THEN 13
        WHEN '14' THEN 14
        WHEN '15' THEN 15
        WHEN '16' THEN 16
        ELSE 99
      END ASC,
      name ASC;
    """

    turnover_sql = """
    SELECT
        turnover_size_code AS code,
        turnover_gross_name_dim AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY turnover_size_code, turnover_gross_name_dim
    ORDER BY turnover_size_code::int ASC NULLS LAST, name ASC;
    """

    status_sql = """
    SELECT
        company_status_code AS code,
        COALESCE(
          MAX(company_status),
          CASE company_status_code
            WHEN '0' THEN 'Har aldrig varit verksam'
            WHEN '1' THEN 'Är verksam'
            WHEN '9' THEN 'Är ej längre verksam'
            ELSE NULL
          END
        ) AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY company_status_code
    ORDER BY count DESC, name ASC;
    """

    state_sql = """
    SELECT
        company_state_code AS code,
        COALESCE(MAX(company_state), company_state_name_dim) AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY company_state_code, company_state_name_dim
    ORDER BY count DESC, name ASC;
    """

    employer_status_sql = """
    SELECT
        employer_status_code AS code,
        employer_status AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY employer_status_code, employer_status
    ORDER BY count DESC, name ASC;
    """

    vat_status_sql = """
    SELECT
        vat_status_code AS code,
        vat_status AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY vat_status_code, vat_status
    ORDER BY count DESC, name ASC;
    """

    f_tax_status_sql = """
    SELECT
        f_tax_status_code AS code,
        f_tax_status AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY f_tax_status_code, f_tax_status
    ORDER BY count DESC, name ASC;
    """

    marketing_sql = """
    SELECT
        reklam_code AS code,
        reklam AS name,
        COUNT(*) AS count
    FROM v_company_full
    GROUP BY reklam_code, reklam
    ORDER BY count DESC, name ASC;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(totals_sql)
        totals_row = cur.fetchone()

        cur.execute(county_sql)
        county_rows = cur.fetchall()

        cur.execute(municipality_sql)
        municipality_rows = cur.fetchall()

        cur.execute(industry_sql)
        industry_rows = cur.fetchall()

        cur.execute(section_sql)
        section_rows = cur.fetchall()

        cur.execute(size_sql)
        size_rows = cur.fetchall()

        cur.execute(turnover_sql)
        turnover_rows = cur.fetchall()

        cur.execute(status_sql)
        status_rows = cur.fetchall()

        cur.execute(state_sql)
        state_rows = cur.fetchall()

        cur.execute(employer_status_sql)
        employer_status_rows = cur.fetchall()

        cur.execute(vat_status_sql)
        vat_status_rows = cur.fetchall()

        cur.execute(f_tax_status_sql)
        f_tax_status_rows = cur.fetchall()

        cur.execute(marketing_sql)
        marketing_rows = cur.fetchall()

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
            "accepts_marketing": totals_row["accepts_marketing"],
            "counties": totals_row["counties"],
            "municipalities": totals_row["municipalities"],
            "industry_groups": totals_row["industry_groups"],
        },
        "by_county": county_rows,
        "by_municipality": municipality_rows,
        "by_industry": _apply_labels(industry_rows, _industry_group_labels()),
        "by_section": section_rows,
        "by_size": size_rows,
        "by_turnover": turnover_rows,
        "by_status": _apply_labels(status_rows, COMPANY_STATUS_LABELS),
        "by_state": state_rows,
        "by_employer_status": employer_status_rows,
        "by_vat_status": vat_status_rows,
        "by_f_tax_status": f_tax_status_rows,
        "by_marketing": marketing_rows,
    }
