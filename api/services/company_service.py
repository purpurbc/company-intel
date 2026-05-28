from ..database import get_db_connection


NAME_SORT_SQL = {
    "asc": "vc.company_name ASC NULLS LAST",
    "desc": "vc.company_name DESC NULLS LAST",
}

METRIC_SORT_SQL = {
    "none": None,
    "turnover_asc": "vc.turnover_size_code::int ASC NULLS LAST",
    "turnover_desc": "vc.turnover_size_code::int DESC NULLS LAST",
    "size_asc": """
        CASE vc.size_class_code
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
          ELSE NULL
        END ASC NULLS LAST
    """,
    "size_desc": """
        CASE vc.size_class_code
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
          ELSE NULL
        END DESC NULLS LAST
    """,
}


def get_companies(
    q: str | None,
    search_by: str,
    county_codes: list[str] | None,
    municipality_codes: list[str] | None,
    company_status_codes: list[str] | None,
    company_state_codes: list[str] | None,
    employer_status_codes: list[str] | None,
    vat_status_codes: list[str] | None,
    f_tax_status_codes: list[str] | None,
    marketing_status_codes: list[str] | None,
    size_class_codes: list[str] | None,
    age_min: int | None,
    age_max: int | None,
    post_ort: str | None,
    post_nr: str | None,
    owner_category_codes: list[str] | None,
    sme_size_codes: list[str] | None,
    export_import_marks: list[str] | None,
    section_codes: list[str] | None,
    industry_codes: list[str] | None,
    industry_detail_codes: list[str] | None,
    turnover_size_codes: list[str] | None,
    name_sort: str,
    metric_sort: str,
    limit: int,
    offset: int,
):
    where = []
    params = {"limit": limit, "offset": offset}

    county_codes = county_codes or []
    municipality_codes = municipality_codes or []
    company_status_codes = company_status_codes or []
    company_state_codes = company_state_codes or []
    employer_status_codes = employer_status_codes or []
    vat_status_codes = vat_status_codes or []
    f_tax_status_codes = f_tax_status_codes or []
    marketing_status_codes = marketing_status_codes or []
    size_class_codes = size_class_codes or []
    owner_category_codes = owner_category_codes or []
    sme_size_codes = sme_size_codes or []
    export_import_marks = export_import_marks or []
    section_codes = section_codes or []
    industry_codes = industry_codes or []
    industry_detail_codes = industry_detail_codes or []
    turnover_size_codes = turnover_size_codes or []

    if q:
        q = q.strip()

        if search_by == "company_name":
            where.append("vc.company_name ILIKE %(q_like)s")
            params["q_like"] = f"%{q}%"

        elif search_by == "org_nr":
            where.append("vc.org_nr = %(q_exact)s")
            params["q_exact"] = q

        else:
            where.append(
                "(vc.company_name ILIKE %(q_like)s OR vc.org_nr = %(q_exact)s)"
            )
            params["q_like"] = f"%{q}%"
            params["q_exact"] = q

    if county_codes:
        where.append("vc.seat_county_code = ANY(%(county_codes)s)")
        params["county_codes"] = county_codes

    if municipality_codes:
        where.append("vc.seat_municipality_code = ANY(%(municipality_codes)s)")
        params["municipality_codes"] = municipality_codes

    if company_status_codes:
        where.append("vc.company_status_code = ANY(%(company_status_codes)s)")
        params["company_status_codes"] = company_status_codes

    if company_state_codes:
        where.append("vc.company_state_code = ANY(%(company_state_codes)s)")
        params["company_state_codes"] = company_state_codes

    if employer_status_codes:
        where.append("c.employer_status_code = ANY(%(employer_status_codes)s)")
        params["employer_status_codes"] = employer_status_codes

    if vat_status_codes:
        where.append("c.vat_status_code = ANY(%(vat_status_codes)s)")
        params["vat_status_codes"] = vat_status_codes

    if f_tax_status_codes:
        where.append("c.f_tax_status_code = ANY(%(f_tax_status_codes)s)")
        params["f_tax_status_codes"] = f_tax_status_codes

    if marketing_status_codes:
        where.append("c.reklam_code = ANY(%(marketing_status_codes)s)")
        params["marketing_status_codes"] = marketing_status_codes

    if size_class_codes:
        where.append("vc.size_class_code = ANY(%(size_class_codes)s)")
        params["size_class_codes"] = size_class_codes

    if age_min is not None:
        where.append(
            """
            EXTRACT(
              YEAR FROM age(CURRENT_DATE, COALESCE(c.start_date, c.registration_date))
            ) >= %(age_min)s
            """
        )
        params["age_min"] = age_min

    if age_max is not None and age_max < 100:
        where.append(
            """
            EXTRACT(
              YEAR FROM age(CURRENT_DATE, COALESCE(c.start_date, c.registration_date))
            ) <= %(age_max)s
            """
        )
        params["age_max"] = age_max

    if post_ort and post_ort.strip():
        where.append("c.post_ort ILIKE %(post_ort)s")
        params["post_ort"] = f"%{post_ort.strip()}%"

    if post_nr and post_nr.strip():
        where.append("regexp_replace(c.post_nr, '\\s+', '', 'g') LIKE %(post_nr)s")
        params["post_nr"] = f"{post_nr.strip().replace(' ', '')}%"

    if owner_category_codes:
        where.append("c.owner_category_code = ANY(%(owner_category_codes)s)")
        params["owner_category_codes"] = owner_category_codes

    if sme_size_codes:
        where.append("c.sme_size_code = ANY(%(sme_size_codes)s)")
        params["sme_size_codes"] = sme_size_codes

    if export_import_marks:
        where.append("c.export_import_mark = ANY(%(export_import_marks)s)")
        params["export_import_marks"] = export_import_marks

    if section_codes:
        where.append("vc.avdelning_1_code = ANY(%(section_codes)s)")
        params["section_codes"] = section_codes

    if industry_codes:
        where.append(
            """
            EXISTS (
                SELECT 1
                FROM unnest(%(industry_codes)s::text[]) AS industry_code
                WHERE (
                    length(industry_code) <= 2
                    AND vc.bransch_1_code LIKE industry_code || '%%'
                )
                OR vc.bransch_1_code = industry_code
            )
            """
        )
        params["industry_codes"] = industry_codes

    if industry_detail_codes:
        where.append("vc.bransch_1_code = ANY(%(industry_detail_codes)s)")
        params["industry_detail_codes"] = industry_detail_codes

    if turnover_size_codes:
        where.append("vc.turnover_size_code = ANY(%(turnover_size_codes)s)")
        params["turnover_size_codes"] = turnover_size_codes

    where_sql = "WHERE " + " AND ".join(where) if where else ""
    name_order_sql = NAME_SORT_SQL.get(name_sort, NAME_SORT_SQL["asc"])
    metric_order_sql = METRIC_SORT_SQL.get(metric_sort)
    order_sql = (
        f"{metric_order_sql}, {name_order_sql}"
        if metric_order_sql
        else name_order_sql
    )

    count_sql = f"""
    SELECT count(*) AS total
    FROM v_company vc
    JOIN company c ON c.org_nr = vc.org_nr
    {where_sql};
    """

    data_sql = f"""
    SELECT vc.*
    FROM v_company vc
    JOIN company c ON c.org_nr = vc.org_nr
    {where_sql}
    ORDER BY {order_sql}
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


def get_company_turnover_history(org_nr: str):
    current_sql = """
    SELECT
      org_nr,
      turnover_year,
      turnover_size_code,
      turnover_gross_name_dim AS turnover_size,
      turnover_fin_size_code,
      turnover_fin_name_dim AS turnover_fin_size
    FROM v_company_full
    WHERE org_nr = %(org_nr)s;
    """

    changes_sql = """
    SELECT
      cc.ingestion_run_id,
      cc.detected_at,
      ir.started_at AS run_started_at,
      cc.field_name,
      cc.old_value,
      cc.new_value,
      cc.old_label,
      cc.new_label
    FROM company_change cc
    LEFT JOIN ingestion_run ir ON ir.id = cc.ingestion_run_id
    WHERE cc.org_nr = %(org_nr)s
      AND cc.field_name IN (
        'turnover_year',
        'turnover_size_code',
        'turnover_fin_size_code'
      )
    ORDER BY COALESCE(ir.started_at, cc.detected_at) DESC, cc.id DESC;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(current_sql, {"org_nr": org_nr})
        current = cur.fetchone()

        if not current:
            return {"items": []}

        cur.execute(changes_sql, {"org_nr": org_nr})
        changes = cur.fetchall()

    state = {
        "turnover_year": current["turnover_year"],
        "turnover_size_code": current["turnover_size_code"],
        "turnover_size": current["turnover_size"],
        "turnover_fin_size_code": current["turnover_fin_size_code"],
        "turnover_fin_size": current["turnover_fin_size"],
    }

    entries_by_year = {}

    def add_state(source: str):
        year = state.get("turnover_year")
        if year is None:
            return

        entries_by_year[int(year)] = {
            "year": int(year),
            "turnover_size_code": state.get("turnover_size_code"),
            "turnover_size": state.get("turnover_size"),
            "turnover_fin_size_code": state.get("turnover_fin_size_code"),
            "turnover_fin_size": state.get("turnover_fin_size"),
            "source": source,
        }

    add_state("current")

    grouped_changes = {}
    for change in changes:
        key = change["ingestion_run_id"] or change["detected_at"]
        grouped_changes.setdefault(key, []).append(change)

    for _, group in grouped_changes.items():
        changed_fields = {change["field_name"] for change in group}
        if not changed_fields:
            continue

        for change in group:
            field_name = change["field_name"]

            if field_name == "turnover_year":
                state["turnover_year"] = (
                    int(change["old_value"])
                    if change["old_value"] is not None
                    else None
                )
            elif field_name == "turnover_size_code":
                state["turnover_size_code"] = change["old_value"]
                state["turnover_size"] = change["old_label"]
            elif field_name == "turnover_fin_size_code":
                state["turnover_fin_size_code"] = change["old_value"]
                state["turnover_fin_size"] = change["old_label"]

        add_state("history")

    return {
        "items": sorted(entries_by_year.values(), key=lambda item: item["year"]),
    }
