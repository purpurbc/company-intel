from datetime import date
from time import perf_counter
from uuid import UUID, uuid4

from psycopg.errors import QueryCanceled

from ..database import get_db_connection
from .company_identity import resolve_company_id
from .company_search import build_company_search, configure_company_search
from ..schemas import MetricSort, NameSort, SearchBy
from fastapi import HTTPException


DATA_QUERY_TIMEOUT_MS = 6000
COUNT_QUERY_TIMEOUT_MS = 5000
ESTIMATE_SAMPLE_PERCENT = 0.5
MAX_LIST_RESULTS = 10_000
NEVER_ACTIVE_STATUS_CODE = "0"


def _activity_status_filter(
    status_codes: list[str], params: dict
) -> str | None:
    """Build the status predicate without hiding the partial-index contract."""
    if not status_codes:
        return None
    if status_codes == [NEVER_ACTIVE_STATUS_CODE]:
        # This is a controlled enum value, not user-provided SQL. Keeping it
        # literal lets PostgreSQL prove that the partial never-active index is
        # valid even after psycopg switches to a generic prepared plan.
        return f"vc.activity_status_code = '{NEVER_ACTIVE_STATUS_CODE}'"
    params["company_status_codes"] = status_codes
    return "vc.activity_status_code = ANY(%(company_status_codes)s)"


# Totals only need canonical filter columns. Keeping this source narrow avoids
# the identifier and label joins in app.company_list while preserving exactly
# the same filter predicates as the result query.
COUNT_COMPANY_SOURCE_SQL = """
        (
            SELECT
                state_id,
                company_id,
                company_name,
                registered_name,
                seat_county_code AS county_code,
                seat_municipality_code AS municipality_code,
                activity_status_code,
                company_state_code,
                employer_status_code,
                vat_status_code,
                f_tax_status_code,
                advertising_status_code,
                employee_size_code,
                start_date,
                scb_registration_date,
                postal_city,
                postal_code,
                ownership_category_code,
                sme_size_code,
                trade_indicator,
                industry_section_code,
                primary_industry_code,
                turnover_class_code AS turnover_size_code
            FROM core.company_current
        ) vc
""".strip()


SAMPLED_COMPANY_SOURCE_SQL = f"""
    SELECT
        state_id,
        company_id,
        company_name,
        registered_name,
        seat_county_code AS county_code,
        seat_municipality_code AS municipality_code,
        activity_status_code,
        company_state_code,
        employer_status_code,
        vat_status_code,
        f_tax_status_code,
        advertising_status_code,
        employee_size_code,
        start_date,
        scb_registration_date,
        postal_city,
        postal_code,
        ownership_category_code,
        sme_size_code,
        trade_indicator,
        industry_section_code,
        primary_industry_code,
        turnover_class_code AS turnover_size_code
    FROM core.company_state_history TABLESAMPLE SYSTEM ({ESTIMATE_SAMPLE_PERCENT})
    WHERE valid_to IS NULL
""".strip()


def _filtered_companies_cte(where_sql: str) -> str:
    """Return an inlineable filter scope for a text-search plan.

    NOT MATERIALIZED is intentional: the same scope feeds current names,
    registered names and aliases, while PostgreSQL remains free to start from
    whichever text or filter index it estimates to be most selective.
    """
    return f"""
        filtered_companies AS NOT MATERIALIZED (
            SELECT vc.*
            FROM {COUNT_COMPANY_SOURCE_SQL}
            {where_sql}
        )
    """


def _search_matches_cte(matches_sql: str) -> str:
    """Keep the match relation inline so predicates can cross the CTE boundary."""
    return f"search_matches AS NOT MATERIALIZED ({matches_sql})"


NAME_SORT_SQL = {
    "asc": "vc.company_name ASC NULLS LAST",
    "desc": "vc.company_name DESC NULLS LAST",
}

METRIC_SORT_SQL = {
    "none": None,
    "turnover_asc": "vc.turnover_size_code::int ASC NULLS LAST",
    "turnover_desc": "vc.turnover_size_code::int DESC NULLS LAST",
    "size_asc": "vc.employee_size_code::int ASC NULLS LAST",
    "size_desc": "vc.employee_size_code::int DESC NULLS LAST",
}

METRIC_PAGE_SORT_SQL = {
    "turnover_asc": "state.turnover_class_code::int ASC NULLS LAST",
    "turnover_desc": "state.turnover_class_code::int DESC NULLS LAST",
    "size_asc": "state.employee_size_code::int ASC NULLS LAST",
    "size_desc": "state.employee_size_code::int DESC NULLS LAST",
}

METRIC_PAGE_SORT_DIRECTION = {
    "turnover_asc": "asc",
    "turnover_desc": "desc",
    "size_asc": "asc",
    "size_desc": "desc",
}

NAME_PAGE_SORT_SQL = {
    "asc": "state.company_name ASC NULLS LAST",
    "desc": "state.company_name DESC NULLS LAST",
}

RESULT_PAGE_NAME_SORT_SQL = {
    "asc": "page.sort_company_name ASC NULLS LAST",
    "desc": "page.sort_company_name DESC NULLS LAST",
}

RESULT_PAGE_METRIC_SORT_SQL = {
    "none": None,
    "turnover_asc": "page.sort_turnover_size_code::int ASC NULLS LAST",
    "turnover_desc": "page.sort_turnover_size_code::int DESC NULLS LAST",
    "size_asc": "page.sort_employee_size_code::int ASC NULLS LAST",
    "size_desc": "page.sort_employee_size_code::int DESC NULLS LAST",
}


def _company_order_sql(
    *, has_search: bool, metric_sort: MetricSort, name_sort: NameSort
) -> str:
    """Keep relevance primary and all user-selected ordering secondary."""
    name_order_sql = NAME_SORT_SQL.get(name_sort, NAME_SORT_SQL["asc"])
    metric_order_sql = METRIC_SORT_SQL.get(metric_sort)
    secondary_order_sql = (
        f"{metric_order_sql}, {name_order_sql}"
        if metric_order_sql
        else name_order_sql
    )
    return (
        f"search_match.search_rank DESC, {secondary_order_sql}"
        if has_search
        else secondary_order_sql
    )


def _company_page_order_sql(
    *, has_search: bool, metric_sort: MetricSort, name_sort: NameSort
) -> str:
    """Repeat the page order over only the bounded rows returned by the CTE."""
    name_order_sql = RESULT_PAGE_NAME_SORT_SQL.get(
        name_sort, RESULT_PAGE_NAME_SORT_SQL["asc"]
    )
    metric_order_sql = RESULT_PAGE_METRIC_SORT_SQL.get(metric_sort)
    secondary_order_sql = (
        f"{metric_order_sql}, {name_order_sql}"
        if metric_order_sql
        else name_order_sql
    )
    return (
        f"page.search_rank DESC, {secondary_order_sql}"
        if has_search
        else secondary_order_sql
    )


def _seek_after_component_sql(
    expression: str, anchor: str, direction: str
) -> str:
    """Compare one nullable ORDER BY component using NULLS LAST semantics."""
    operator = ">" if direction == "asc" else "<"
    return (
        f"({anchor} IS NOT NULL AND "
        f"({expression} IS NULL OR {expression} {operator} {anchor}))"
    )


def _page_seek_sql(
    components: list[tuple[str, str, str]],
    *, company_id_expression: str,
    anchor_company_id: str,
) -> str:
    """Build a readable lexicographic seek predicate for an arbitrary page."""
    clauses = []
    equal_prefix = []
    for expression, anchor, direction in components:
        after = _seek_after_component_sql(expression, anchor, direction)
        clauses.append(" AND ".join([*equal_prefix, after]))
        equal_prefix.append(f"{expression} IS NOT DISTINCT FROM {anchor}")
    clauses.append(
        " AND ".join(
            [*equal_prefix, f"{company_id_expression} >= {anchor_company_id}"]
        )
    )
    return "(\n" + "\nOR ".join(clauses) + "\n)"


def _unfiltered_page_sql(
    metric_sort: MetricSort, name_sort: NameSort
) -> str:
    """Use an index-only anchor before fetching a deep result page.

    OFFSET is retained only for the compact sort index, which supports direct
    page jumps. The following seek reads heap rows only for the requested page;
    this avoids thousands of random reads from the large history table.
    """
    metric_order = METRIC_PAGE_SORT_SQL.get(metric_sort)
    name_order = NAME_PAGE_SORT_SQL.get(name_sort, NAME_PAGE_SORT_SQL["asc"])
    name_direction = "desc" if name_sort == "desc" else "asc"
    anchor_fields = ["state.company_name AS sort_company_name", "state.company_id"]
    seek_components: list[tuple[str, str, str]] = [
        ("state.company_name", "anchor.sort_company_name", name_direction)
    ]
    order_parts = []
    if metric_order:
        metric_expression = metric_order.split(" ", 1)[0]
        anchor_fields.insert(0, f"{metric_expression} AS sort_metric")
        seek_components.insert(
            0,
            (
                metric_expression,
                "anchor.sort_metric",
                METRIC_PAGE_SORT_DIRECTION[metric_sort],
            ),
        )
        order_parts.append(metric_order)
    order_parts.extend([name_order, "state.company_id"])
    order_sql = ", ".join(order_parts)
    seek_sql = _page_seek_sql(
        seek_components,
        company_id_expression="state.company_id",
        anchor_company_id="anchor.company_id",
    )
    return f"""
        WITH page_anchor AS MATERIALIZED (
            SELECT {", ".join(anchor_fields)}
            FROM core.company_state_history state
            WHERE state.valid_to IS NULL
            ORDER BY {order_sql}
            LIMIT 1 OFFSET %(offset)s
        ),
        company_page AS MATERIALIZED (
            SELECT state.state_id, state.company_id
            FROM core.company_state_history state
            CROSS JOIN page_anchor anchor
            WHERE state.valid_to IS NULL
              AND {seek_sql}
            ORDER BY {order_sql}
            LIMIT %(limit)s
        )
        SELECT vc.company_id, c.entity_type, vc.org_nr, vc.pe_org_nr, vc.company_name, vc.registered_name,
            NULL::text AS matched_name,
            display_state.co_address AS care_of_address, display_state.postal_address,
            display_state.postal_code, vc.postal_city,
            vc.county_code, vc.county_name, vc.municipality_code, vc.municipality_name,
            vc.region_code, vc.region_name, vc.industry_section_code, vc.industry_section_name,
            vc.primary_industry_code, vc.primary_industry_name, vc.employee_size_code, vc.employee_size,
            vc.turnover_size_code, vc.turnover_size, vc.turnover_financial_size_code,
            vc.turnover_financial_size, vc.legal_form_code, vc.legal_form,
            vc.organization_form_code, vc.organization_form, vc.sector_code, vc.sector,
            vc.activity_status_code, vc.activity_status, vc.company_state_code, vc.company_state,
            vc.employer_status_code, vc.employer_status, vc.ingested_at
        FROM company_page page
        JOIN app.company_list vc ON vc.state_id = page.state_id
        JOIN core.company_state_history display_state ON display_state.state_id = page.state_id
        JOIN core.company c ON c.company_id = page.company_id
        ORDER BY {_company_order_sql(has_search=False, metric_sort=metric_sort, name_sort=name_sort)}, vc.company_id;
    """


def _estimated_total(cur, estimate_sql: str, params: dict) -> int | None:
    """Return PostgreSQL's cheap row estimate without executing the search."""
    try:
        cur.execute(f"EXPLAIN (FORMAT JSON) {estimate_sql}", params)
        payload = cur.fetchone()["QUERY PLAN"]
        if not payload:
            return None
        plan = payload[0].get("Plan", {})
        estimated = plan.get("Plan Rows")
        return max(0, round(float(estimated))) if estimated is not None else None
    except Exception:
        connection = getattr(cur, "connection", None)
        if connection is not None:
            connection.rollback()
        return None


def _sampled_total(
    cur,
    *,
    predicates: list[str],
    params: dict,
    minimum_total: int,
) -> int | None:
    """Estimate non-text filters from a small physical sample.

    Planner estimates become misleading when coverage fields are correlated
    (active companies commonly have geography and industry together). Sampling
    those predicates as a group keeps the progressive total useful while still
    reading only a small fraction of the current-state table.
    """
    predicate_sql = " AND ".join(predicates) if predicates else "TRUE"
    try:
        cur.execute("SET LOCAL statement_timeout = '3000ms'")
        cur.execute(
            f"""
            WITH sampled_current AS MATERIALIZED (
                {SAMPLED_COMPANY_SOURCE_SQL}
            )
            SELECT
                count(*)::bigint AS sampled_total,
                count(*) FILTER (WHERE {predicate_sql})::bigint AS matched_total
            FROM sampled_current vc;
            """,
            params,
        )
        sample = cur.fetchone()
        sampled_total = int(sample["sampled_total"])
        if sampled_total <= 0:
            return None
        current_total = _estimated_total(
            cur,
            "SELECT 1 FROM core.company_current",
            {},
        )
        if current_total is None:
            return None
        estimate = round(current_total * int(sample["matched_total"]) / sampled_total)
        return max(minimum_total, estimate)
    except Exception:
        connection = getattr(cur, "connection", None)
        if connection is not None:
            connection.rollback()
        return None


def _best_effort_filtered_total(
    cur,
    *,
    predicates: list[str],
    estimate_sql: str,
    params: dict,
    minimum_total: int,
) -> int | None:
    """Prefer the correlated sample and retain a cheap planner fallback.

    Sampling is more useful for correlated filters, but complex predicates can
    consume their own timeout after the exact count has already timed out. An
    EXPLAIN estimate is less precise, yet still more useful than dropping the
    total contract entirely.
    """
    sampled_total = _sampled_total(
        cur,
        predicates=predicates,
        params=params,
        minimum_total=minimum_total,
    )
    if sampled_total is not None:
        return sampled_total

    planner_total = _estimated_total(cur, estimate_sql, params)
    if planner_total is None:
        return None
    return max(minimum_total, planner_total)


def _record_search_event(conn, cur, **event) -> None:
    """Telemetry must never make a product search fail."""
    try:
        cur.execute(
            """
            INSERT INTO app.search_event (
                search_id, event_type, outcome, duration_ms, search_mode,
                query_length, search_by, fuzzy_used, filter_count,
                filter_keys, result_count, total_value, total_kind, reformulated,
                company_id, click_position
            ) VALUES (
                %(search_id)s, %(event_type)s, %(outcome)s, %(duration_ms)s,
                %(search_mode)s, %(query_length)s, %(search_by)s,
                %(fuzzy_used)s, %(filter_count)s, %(filter_keys)s,
                %(result_count)s, %(total_value)s, %(total_kind)s, %(reformulated)s,
                %(company_id)s, %(click_position)s
            );
            """,
            event,
        )
    except Exception:
        rollback = getattr(conn, "rollback", None)
        if callable(rollback):
            rollback()


def record_search_result_click(
    *, search_id: UUID, company_id: int, position: int
) -> None:
    with get_db_connection() as conn, conn.cursor() as cur:
        _record_search_event(
            conn,
            cur,
            search_id=search_id,
            event_type="click",
            outcome="ok",
            duration_ms=None,
            search_mode=None,
            query_length=None,
            search_by=None,
            fuzzy_used=None,
            filter_count=None,
            filter_keys=[],
            result_count=None,
            total_value=None,
            total_kind=None,
            reformulated=False,
            company_id=company_id,
            click_position=position,
        )


def get_companies(
    q: str | None,
    search_by: SearchBy,
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
    name_sort: NameSort,
    metric_sort: MetricSort,
    limit: int,
    offset: int,
    include_total: bool = False,
    count_only: bool = False,
    search_id: UUID | None = None,
    reformulated: bool = False,
    allow_estimated_total: bool = True,
):
    started_at = perf_counter()
    telemetry_search_id = search_id or uuid4()
    where = []
    params = {"limit": limit + 1, "offset": offset}

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
    search_plan = None
    if q and q.strip():
        q = q.strip()

    if county_codes:
        where.append("vc.county_code = ANY(%(county_codes)s)")
        params["county_codes"] = county_codes

    if municipality_codes:
        where.append("vc.municipality_code = ANY(%(municipality_codes)s)")
        params["municipality_codes"] = municipality_codes

    activity_status_filter = _activity_status_filter(company_status_codes, params)
    if activity_status_filter:
        where.append(activity_status_filter)

    if company_state_codes:
        where.append("vc.company_state_code = ANY(%(company_state_codes)s)")
        params["company_state_codes"] = company_state_codes

    if employer_status_codes:
        where.append("vc.employer_status_code = ANY(%(employer_status_codes)s)")
        params["employer_status_codes"] = employer_status_codes

    if vat_status_codes:
        where.append("vc.vat_status_code = ANY(%(vat_status_codes)s)")
        params["vat_status_codes"] = vat_status_codes

    if f_tax_status_codes:
        where.append("vc.f_tax_status_code = ANY(%(f_tax_status_codes)s)")
        params["f_tax_status_codes"] = f_tax_status_codes

    if marketing_status_codes:
        where.append("vc.advertising_status_code = ANY(%(marketing_status_codes)s)")
        params["marketing_status_codes"] = marketing_status_codes

    if size_class_codes:
        where.append("vc.employee_size_code = ANY(%(size_class_codes)s)")
        params["size_class_codes"] = size_class_codes

    if age_min is not None:
        where.append(
            """
            COALESCE(vc.start_date, vc.scb_registration_date) <=
              ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Stockholm')::date
              - make_interval(years => %(age_min)s))::date
            """
        )
        params["age_min"] = age_min

    if age_max is not None and age_max < 100:
        where.append(
            """
            COALESCE(vc.start_date, vc.scb_registration_date) >
              ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Stockholm')::date
              - make_interval(years => %(age_max_plus_one)s))::date
            """
        )
        params["age_max_plus_one"] = age_max + 1

    if post_ort and post_ort.strip():
        where.append("vc.postal_city ILIKE %(post_ort)s")
        params["post_ort"] = f"%{post_ort.strip()}%"

    if post_nr and post_nr.strip():
        where.append("regexp_replace(vc.postal_code, '\\s+', '', 'g') LIKE %(post_nr)s")
        params["post_nr"] = f"{post_nr.strip().replace(' ', '')}%"

    if owner_category_codes:
        where.append("vc.ownership_category_code = ANY(%(owner_category_codes)s)")
        params["owner_category_codes"] = owner_category_codes

    if sme_size_codes:
        where.append("vc.sme_size_code = ANY(%(sme_size_codes)s)")
        params["sme_size_codes"] = sme_size_codes

    if export_import_marks:
        where.append("vc.trade_indicator = ANY(%(export_import_marks)s)")
        params["export_import_marks"] = export_import_marks

    if section_codes:
        where.append("vc.industry_section_code = ANY(%(section_codes)s)")
        params["section_codes"] = section_codes

    if industry_codes:
        industry_prefix_patterns = [
            f"{code}%" for code in industry_codes if len(code) <= 2
        ]
        industry_exact_codes = [code for code in industry_codes if len(code) > 2]
        industry_predicates = []
        if industry_prefix_patterns:
            industry_predicates.append(
                "i.sni_code LIKE ANY(%(industry_prefix_patterns)s)"
            )
            params["industry_prefix_patterns"] = industry_prefix_patterns
        if industry_exact_codes:
            industry_predicates.append(
                "i.sni_code = ANY(%(industry_exact_codes)s)"
            )
            params["industry_exact_codes"] = industry_exact_codes
        where.append(
            f"""
            EXISTS (
                SELECT 1
                FROM core.company_industry i
                WHERE i.state_id = vc.state_id
                  AND ({" OR ".join(industry_predicates)})
            )
            """
        )

    if industry_detail_codes:
        where.append("EXISTS (SELECT 1 FROM core.company_industry i WHERE i.state_id = vc.state_id AND i.sni_code = ANY(%(industry_detail_codes)s))")
        params["industry_detail_codes"] = industry_detail_codes

    if turnover_size_codes:
        where.append("vc.turnover_size_code = ANY(%(turnover_size_codes)s)")
        params["turnover_size_codes"] = turnover_size_codes

    filter_keys = [
        key
        for key, active in (
            ("county_codes", county_codes),
            ("municipality_codes", municipality_codes),
            ("company_status_codes", company_status_codes),
            ("company_state_codes", company_state_codes),
            ("employer_status_codes", employer_status_codes),
            ("vat_status_codes", vat_status_codes),
            ("f_tax_status_codes", f_tax_status_codes),
            ("marketing_status_codes", marketing_status_codes),
            ("size_class_codes", size_class_codes),
            ("owner_category_codes", owner_category_codes),
            ("sme_size_codes", sme_size_codes),
            ("export_import_marks", export_import_marks),
            ("section_codes", section_codes),
            ("industry_codes", industry_codes),
            ("industry_detail_codes", industry_detail_codes),
            ("turnover_size_codes", turnover_size_codes),
            ("age_min", age_min is not None),
            ("age_max", age_max is not None and age_max < 100),
            ("post_ort", bool(post_ort and post_ort.strip())),
            ("post_nr", bool(post_nr and post_nr.strip())),
        )
        if active
    ]
    filter_count = (
        sum(
            len(values)
            for values in (
                county_codes,
                municipality_codes,
                company_status_codes,
                company_state_codes,
                employer_status_codes,
                vat_status_codes,
                f_tax_status_codes,
                marketing_status_codes,
                size_class_codes,
                owner_category_codes,
                sme_size_codes,
                export_import_marks,
                section_codes,
                industry_codes,
                industry_detail_codes,
                turnover_size_codes,
            )
        )
        + int(age_min is not None)
        + int(age_max is not None and age_max < 100)
        + int(bool(post_ort and post_ort.strip()))
        + int(bool(post_nr and post_nr.strip()))
    )

    where_sql = "WHERE " + " AND ".join(where) if where else ""

    if q:
        search_plan = build_company_search(
            q,
            search_by,
            candidate_limit=min(
                MAX_LIST_RESULTS * 2,
                max(200, (offset + limit) * 2),
            ),
            restrict_to_filtered=bool(where),
        )
        params.update(search_plan.params)

    search_mode = "results"
    effective_offset = offset
    effective_limit = min(limit, MAX_LIST_RESULTS - effective_offset)
    fetch_extra_row = effective_offset + effective_limit < MAX_LIST_RESULTS
    params["limit"] = effective_limit + int(fetch_extra_row)
    params["offset"] = effective_offset

    def render_search_sql(plan):
        scope_cte_sql = (
            _filtered_companies_cte(where_sql)
            if plan and where
            else None
        )
        effective_where_sql = "" if scope_cte_sql else where_sql

        def search_ctes(matches_sql: str) -> str:
            ctes = []
            if scope_cte_sql:
                ctes.append(scope_cte_sql)
            ctes.append(_search_matches_cte(matches_sql))
            return "WITH " + ",".join(ctes)

        data_search_cte_sql = search_ctes(plan.matches_sql) if plan else ""
        count_matches_sql = (
            (plan.count_matches_sql or plan.matches_sql) if plan else ""
        )
        count_search_cte_sql = (
            search_ctes(count_matches_sql)
            if plan
            else ""
        )
        search_join_sql = (
            "JOIN search_matches search_match "
            "ON search_match.company_id = vc.company_id"
            if plan
            else ""
        )
        effective_order_sql = _company_order_sql(
            has_search=bool(plan),
            metric_sort=metric_sort,
            name_sort=name_sort,
        )
        page_order_sql = _company_page_order_sql(
            has_search=bool(plan),
            metric_sort=metric_sort,
            name_sort=name_sort,
        )
        matched_name_sql = (
            "CASE WHEN search_match.match_source = 'alias' "
            "THEN search_match.matched_name ELSE NULL::text END"
            if plan
            else "NULL::text"
        )
        count_sql = f"""
        {count_search_cte_sql}
        SELECT count(*) AS total
        FROM {"search_matches" if plan else COUNT_COMPANY_SOURCE_SQL}
        {"" if plan else effective_where_sql};
        """
        estimate_sql = f"""
        {count_search_cte_sql}
        SELECT 1
        FROM {"search_matches" if plan else COUNT_COMPANY_SOURCE_SQL}
        {"" if plan else effective_where_sql};
        """
        page_cte_prefix = f"{data_search_cte_sql}," if plan else "WITH"
        page_company_source_sql = (
            "filtered_companies vc" if scope_cte_sql else COUNT_COMPANY_SOURCE_SQL
        )
        data_sql = f"""
        {page_cte_prefix}
        company_page AS MATERIALIZED (
            SELECT
                vc.state_id,
                vc.company_id,
                {matched_name_sql} AS matched_name,
                {"search_match.search_rank" if plan else "NULL::real"} AS search_rank,
                vc.company_name AS sort_company_name,
                vc.turnover_size_code AS sort_turnover_size_code,
                vc.employee_size_code AS sort_employee_size_code
            FROM {page_company_source_sql}
            {search_join_sql}
            {effective_where_sql}
            ORDER BY {effective_order_sql}, vc.company_id
            LIMIT %(limit)s OFFSET %(offset)s
        )
        SELECT vc.company_id, c.entity_type, vc.org_nr, vc.pe_org_nr, vc.company_name, vc.registered_name,
            page.matched_name,
            display_state.co_address AS care_of_address, display_state.postal_address,
            display_state.postal_code, vc.postal_city,
            vc.county_code, vc.county_name, vc.municipality_code, vc.municipality_name,
            vc.region_code, vc.region_name, vc.industry_section_code, vc.industry_section_name,
            vc.primary_industry_code, vc.primary_industry_name, vc.employee_size_code, vc.employee_size,
            vc.turnover_size_code, vc.turnover_size, vc.turnover_financial_size_code,
            vc.turnover_financial_size, vc.legal_form_code, vc.legal_form,
            vc.organization_form_code, vc.organization_form, vc.sector_code, vc.sector,
            vc.activity_status_code, vc.activity_status, vc.company_state_code, vc.company_state,
            vc.employer_status_code, vc.employer_status, vc.ingested_at
        FROM company_page page
        JOIN app.company_list vc ON vc.state_id = page.state_id
        JOIN core.company_state_history display_state ON display_state.state_id = page.state_id
        JOIN core.company c ON c.company_id = page.company_id
        ORDER BY {page_order_sql}, page.company_id;
        """
        if not plan and not where:
            data_sql = _unfiltered_page_sql(metric_sort, name_sort)
        return count_sql, data_sql, estimate_sql

    count_sql, data_sql, estimate_sql = render_search_sql(search_plan)
    if not search_plan and not where:
        # The unfiltered total is requested after every reset. Count current
        # canonical states instead of the wide company view; this stays exact
        # without the identifier and label joins.
        count_sql = """
        SELECT count(*)::bigint AS total
        FROM core.company_current;
        """
        estimate_sql = "SELECT 1 FROM core.company_current;"

    with get_db_connection() as conn, conn.cursor() as cur:
        if search_plan:
            configure_company_search(cur, search_plan)
        rows = []
        has_more = False
        total = None
        total_kind = "none"
        outcome = "ok"

        def record_event(event_outcome: str) -> None:
            _record_search_event(
                conn,
                cur,
                search_id=telemetry_search_id,
                event_type="count" if count_only else "data",
                outcome=event_outcome,
                duration_ms=round((perf_counter() - started_at) * 1000, 2),
                search_mode=search_mode,
                query_length=len(q or ""),
                search_by=search_by,
                fuzzy_used=bool(search_plan and search_plan.uses_fuzzy_matching),
                filter_count=filter_count,
                filter_keys=filter_keys,
                result_count=len(rows),
                total_value=total,
                total_kind=total_kind,
                reformulated=reformulated,
                company_id=None,
                click_position=None,
            )

        if not count_only:
            try:
                # JIT setup is disproportionately expensive for interactive
                # pages that return at most a few hundred rows. Counts retain
                # PostgreSQL's default because long aggregations can benefit.
                cur.execute("SET LOCAL jit = off")
                cur.execute(f"SET LOCAL statement_timeout = '{DATA_QUERY_TIMEOUT_MS}ms'")
                cur.execute(data_sql, params)
                rows = cur.fetchall()
                expanded_plan = search_plan.expanded() if search_plan else None
                if len(rows) < params["limit"] and expanded_plan:
                    search_plan = expanded_plan
                    count_sql, data_sql, estimate_sql = render_search_sql(
                        search_plan
                    )
                    cur.execute(data_sql, params)
                    rows = cur.fetchall()
                fuzzy_plan = search_plan.fuzzy_fallback() if search_plan else None
                if not rows and fuzzy_plan:
                    search_plan = fuzzy_plan
                    configure_company_search(cur, search_plan)
                    count_sql, data_sql, estimate_sql = render_search_sql(
                        search_plan
                    )
                    cur.execute(data_sql, params)
                    rows = cur.fetchall()
                has_more = (
                    len(rows) > effective_limit
                    and effective_offset + effective_limit < MAX_LIST_RESULTS
                )
                rows = rows[:effective_limit]
            except QueryCanceled as exc:
                conn.rollback()
                record_event("timeout")
                raise HTTPException(
                    status_code=504,
                    detail=(
                        "Sökningen tog för lång tid. Försök avgränsa med filter."
                    ),
                ) from exc

        if include_total and search_mode != "autocomplete":
            try:
                cur.execute(f"SET LOCAL statement_timeout = '{COUNT_QUERY_TIMEOUT_MS}ms'")
                cur.execute(count_sql, params)
                total = cur.fetchone()["total"]
                total_kind = "exact"
                fuzzy_plan = search_plan.fuzzy_fallback() if search_plan else None
                if (
                    count_only
                    and total == 0
                    and fuzzy_plan
                ):
                    search_plan = fuzzy_plan
                    configure_company_search(cur, search_plan)
                    count_sql, data_sql, estimate_sql = render_search_sql(
                        search_plan
                    )
                    cur.execute(count_sql, params)
                    total = cur.fetchone()["total"]
                    total_kind = "exact"
            except QueryCanceled:
                conn.rollback()
                outcome = "timeout"
                if allow_estimated_total:
                    if search_plan:
                        configure_company_search(cur, search_plan)
                    total = (
                        _estimated_total(cur, estimate_sql, params)
                        if search_plan
                        else _best_effort_filtered_total(
                            cur,
                            predicates=where,
                            estimate_sql=estimate_sql,
                            params=params,
                            minimum_total=effective_offset + len(rows),
                        )
                    )
                    total_kind = "estimated" if total is not None else "none"

        record_event(outcome)

    return {
        "items": rows,
        "total": total,
        "total_kind": total_kind,
        "search_mode": search_mode,
        "has_more": has_more,
        "limit": limit,
        "offset": effective_offset,
        "result_window_limit": MAX_LIST_RESULTS,
    }

def get_company_by_orgnr(org_nr: str):
    with get_db_connection() as conn, conn.cursor() as cur:
        try:
            company_id = resolve_company_id(cur, org_nr)
        except HTTPException as exc:
            if exc.status_code == 404:
                return None
            raise
        return _company_detail(cur, company_id)


def get_company_by_id(company_id: int):
    with get_db_connection() as conn, conn.cursor() as cur:
        resolve_company_id(cur, company_id=company_id)
        return _company_detail(cur, company_id)


def _normalized_name(value) -> str:
    return str(value or "").strip().casefold()


def _registration_date_key(registration) -> str:
    payload = registration.get("registration") or {}
    dates = [payload.get("registered_on")]
    dates.extend(
        name.get("registered_on")
        for name in (registration.get("names") or [])
        if isinstance(name, dict)
    )
    return max((str(value) for value in dates if value), default="")


def _registration_details(registrations, preferred_names) -> dict:
    """Use the current registration for content and the first BV date for age."""
    if not registrations:
        return {
            "bolagsverket_registration_date": None,
            "bolagsverket_registration_active": None,
            "registered_name_date": None,
            "business_description": None,
        }

    normalized_preferences = [
        _normalized_name(value) for value in preferred_names if _normalized_name(value)
    ]

    def score(item):
        payload = item.get("registration") or {}
        names = item.get("names") or []
        normalized_names = {
            _normalized_name(name.get("name"))
            for name in names
            if isinstance(name, dict)
        }
        name_score = max(
            (
                len(normalized_preferences) - index
                for index, value in enumerate(normalized_preferences)
                if value in normalized_names
            ),
            default=0,
        )
        active_score = 1 if not payload.get("deregistered_on") else 0
        return active_score, name_score, _registration_date_key(item)

    selected = max(registrations, key=score)
    payload = selected.get("registration") or {}
    names = [
        name for name in (selected.get("names") or []) if isinstance(name, dict)
    ]

    def name_score(name):
        normalized = _normalized_name(name.get("name"))
        preference_score = max(
            (
                len(normalized_preferences) - index
                for index, value in enumerate(normalized_preferences)
                if value == normalized
            ),
            default=0,
        )
        return preference_score, str(name.get("registered_on") or "")

    selected_name = max(names, key=name_score) if names else None
    description = str(payload.get("business_description") or "").strip() or None
    first_registration_date = min(
        (
            str((item.get("registration") or {}).get("registered_on"))
            for item in registrations
            if (item.get("registration") or {}).get("registered_on")
        ),
        default=None,
    )

    return {
        "bolagsverket_registration_date": first_registration_date,
        "bolagsverket_registration_active": not bool(payload.get("deregistered_on")),
        "registered_name_date": (
            selected_name.get("registered_on") if selected_name else None
        ),
        "business_description": description,
    }


def _company_detail(cur, company_id):
    cur.execute('SELECT * FROM app.company WHERE company_id = %s', (company_id,))
    row = cur.fetchone()
    if row is None:
        return None
    row.pop("business_description", None)
    cur.execute('SELECT * FROM app.company_registration WHERE company_id = %s ORDER BY source_subkey', (company_id,))
    registrations = cur.fetchall()
    row['registrations'] = registrations
    row.update(
        _registration_details(
            registrations,
            [row.get("registered_name"), row.get("company_name")],
        )
    )
    cur.execute('SELECT rank, sni_code, sni_version, source FROM core.company_industry WHERE state_id = %s ORDER BY rank', (row['state_id'],))
    row['industries'] = cur.fetchall()
    return row


def get_company_turnover_history(org_nr: str):
    current_sql = """
    SELECT
      org_nr,
      turnover_year,
      turnover_size_code,
      turnover_size,
      turnover_financial_size_code,
      turnover_financial_size
    FROM app.company
    WHERE company_id = %(company_id)s;
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
    FROM app.company_change cc
    LEFT JOIN meta.ingestion_run ir ON ir.id = cc.ingestion_run_id
    WHERE cc.company_id = %(company_id)s
      AND cc.field_name IN (
        'turnover_year',
        'turnover_class_code',
        'turnover_detail_class_code'
      )
    ORDER BY COALESCE(ir.started_at, cc.detected_at) DESC, cc.id DESC;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        company_id = resolve_company_id(cur, org_nr)
        cur.execute(current_sql, {"company_id": company_id})
        current = cur.fetchone()

        if not current:
            return {"items": []}

        cur.execute(changes_sql, {"company_id": company_id})
        changes = cur.fetchall()

    state = {
        "turnover_year": current["turnover_year"],
        "turnover_size_code": current["turnover_size_code"],
        "turnover_size": current["turnover_size"],
        "turnover_financial_size_code": current["turnover_financial_size_code"],
        "turnover_financial_size": current["turnover_financial_size"],
    }

    entries_by_year = {}

    def add_state(source: str):
        year = state.get("turnover_year")
        if year is None:
            return

        entries_by_year.setdefault(int(year), {
            "year": int(year),
            "turnover_size_code": state.get("turnover_size_code"),
            "turnover_size": state.get("turnover_size"),
            "turnover_financial_size_code": state.get("turnover_financial_size_code"),
            "turnover_financial_size": state.get("turnover_financial_size"),
            "source": source,
        })

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
            elif field_name == "turnover_class_code":
                state["turnover_size_code"] = change["old_value"]
                state["turnover_size"] = change["old_label"]
            elif field_name == "turnover_detail_class_code":
                state["turnover_financial_size_code"] = change["old_value"]
                state["turnover_financial_size"] = change["old_label"]

        add_state("history")

    return {
        "items": sorted(entries_by_year.values(), key=lambda item: item["year"]),
    }


FIELD_LABELS = {
    "company_name": "Namn",
    "registered_name": "Registrerat företagsnamn",
    "postal_address": "Adress",
    "postal_code": "Postnummer",
    "postal_city": "Postort",
    "co_address": "C/O-adress",
    "seat_municipality_code": "Kommun",
    "seat_county_code": "Län",
    "region_code": "Region",
    "activity_status_code": "Verksamhetsstatus",
    "company_state_code": "Bolagsläge",
    "legal_form_code": "Juridisk form",
    "organization_form_code": "Organisationsform",
    "primary_industry_code": "Huvudbransch",
    "industry_section_code": "Avdelning",
    "employee_size_code": "Anställda",
    "turnover_year": "Omsättningsår",
    "turnover_class_code": "Omsättning",
    "turnover_detail_class_code": "Detaljerad omsättningsklass",
    "ownership_category_code": "Ägarkategori",
    "sector_code": "Sektor",
    "sme_size_code": "SMF-klass",
    "vat_status_code": "Momsstatus",
    "f_tax_status_code": "F-skatt",
    "employer_status_code": "Arbetsgivarstatus",
    "advertising_status_code": "Reklamstatus",
    "bulk_advertising_status_code": "Reklamstatus från bulkfil",
    "phone": "Telefon",
    "email": "E-post",
}

SOURCE_LABELS = {
    "scb_api": "SCB",
    "scb_bulk": "SCB",
    "bolagsverket": "Bolagsverket",
    "legacy": "SCB",
}

EVENT_TITLE_LABELS = {
    # De engelska nycklarna finns kvar eftersom äldre importer har lagrat dem.
    # Värdena är de enda texter som visas för användaren.
    "New company observed": "Ny företagsrad upptäckt",
    "Company data changed": "Företagsdata ändrades",
    "Registered municipality changed": "Kommun ändrades",
    "Registered county changed": "Län ändrades",
    "Industry changed": "Bransch ändrades",
    "Company status changed": "Verksamhetsstatus ändrades",
    "Activity status changed": "Verksamhetsstatus ändrades",
    "Företagsstatus ändrades": "Verksamhetsstatus ändrades",
    "Primary industry changed": "Huvudbransch ändrades",
    "Registered as employer": "Registrerades som arbetsgivare",
    "VAT registered": "Registrerades för moms",
    "F-tax registered": "Registrerades för F-skatt",
    "Omsättningsklass ökade": "Omsättningsintervallet ökade",
    "Omsättningsklass minskade": "Omsättningsintervallet minskade",
    "Blev registrerad för F-skatt": "Registrerades för F-skatt",
}

COMPANY_EVENT_DESCRIPTIONS = {
    "Blev registrerad för F-skatt": "Företaget registrerades för F-skatt.",
    "Blev avregistrerad för F-skatt": "Företaget avregistrerades för F-skatt.",
    "Blev registrerad för moms": "Företaget registrerades för moms.",
    "Blev avregistrerad för moms": "Företaget avregistrerades för moms.",
    "Blev registrerad som arbetsgivare": "Företaget registrerades som arbetsgivare.",
    "Blev avregistrerad som arbetsgivare": "Företaget avregistrerades som arbetsgivare.",
    "Registered as employer": "Företaget registrerades som arbetsgivare.",
    "VAT registered": "Företaget registrerades för moms.",
    "F-tax registered": "Företaget registrerades för F-skatt.",
    "Registrerades som arbetsgivare": "Företaget registrerades som arbetsgivare.",
    "Registrerades för moms": "Företaget registrerades för moms.",
    "Registrerades för F-skatt": "Företaget registrerades för F-skatt.",
}

BOLAGSVERKET_DEREGISTRATION_REASONS = {
    # Ordalydelsen följer Bolagsverkets kodlista för
    # avregistreringsorsak (AVORG).
    "AKEJH-AVORG": "Aktiekapitalet inte höjts",
    "ARSEED-AVORG": "Årsredovisning saknas",
    "AVREG-AVORG": "Avregistrerad",
    "BABAKEJH-AVORG": "Ombildat till bankaktiebolag eller aktiekapitalet inte höjts",
    "DELAV-AVORG": "Delning",
    "DOM-AVORG": "Beslut av instans",
    "FUAV-AVORG": "Fusion",
    "GROMAV-AVORG": "Gränsöverskridande ombildning",
    "KKAV-AVORG": "Konkurs",
    "LIAV-AVORG": "Likvidation",
    "NYINN-AVORG": "Ny innehavare",
    "OMAV-AVORG": "Ombildning",
    "OMBAB-AVORG": "Ombildat till bankaktiebolag",
    "OVERK-AVORG": "Overksamhet",
    "UTLKKLI-AVORG": "Det utländska företagets likvidation eller konkurs",
    "VDSAK-AVORG": "Verkställande direktör saknas",
    "VERKUPP-AVORG": "Verksamheten har upphört",
}

BOLAGSVERKET_RESTRUCTURING_PROCEDURES = {
    "AC-AVOMFO": "Ackordsförhandling",
    "DEOL-AVOMFO": "Överlåtande vid delning",
    "DEOT-AVOMFO": "Övertagande vid delning",
    "FR-AVOMFO": "Företagsrekonstruktion",
    "FUOL-AVOMFO": "Överlåtande i fusion",
    "FUOT-AVOMFO": "Övertagande i fusion",
    "GROM-AVOMFO": "Gränsöverskridande ombildning",
    "KK-AVOMFO": "Konkurs",
    "LI-AVOMFO": "Likvidation",
    "OM-AVOMFO": "Ombildning",
    "RES-AVOMFO": "Resolution",
}

PROCEDURE_EVENT_COPY = {
    "AC-AVOMFO": (
        "Ackordsförhandling inleddes",
        "Bolagsverket registrerade att en ackordsförhandling hade inletts.",
    ),
    "DEOL-AVOMFO": (
        "Överlåtande vid delning registrerades",
        "Bolagsverket registrerade företaget som överlåtande vid delning.",
    ),
    "DEOT-AVOMFO": (
        "Övertagande vid delning registrerades",
        "Bolagsverket registrerade företaget som övertagande vid delning.",
    ),
    "FR-AVOMFO": (
        "Företagsrekonstruktion inleddes",
        "Bolagsverket registrerade att en företagsrekonstruktion hade inletts.",
    ),
    "FUOL-AVOMFO": (
        "Överlåtande i fusion registrerades",
        "Bolagsverket registrerade företaget som överlåtande i en fusion.",
    ),
    "FUOT-AVOMFO": (
        "Övertagande i fusion registrerades",
        "Bolagsverket registrerade företaget som övertagande i en fusion.",
    ),
    "GROM-AVOMFO": (
        "Gränsöverskridande ombildning inleddes",
        "Bolagsverket registrerade att en gränsöverskridande ombildning hade inletts.",
    ),
    "KK-AVOMFO": (
        "Konkurs inleddes",
        "Bolagsverket registrerade att ett konkursförfarande hade inletts.",
    ),
    "LI-AVOMFO": (
        "Likvidation inleddes",
        "Bolagsverket registrerade att ett likvidationsförfarande hade inletts.",
    ),
    "OM-AVOMFO": (
        "Ombildning inleddes",
        "Bolagsverket registrerade att en ombildning hade inletts.",
    ),
    "RES-AVOMFO": (
        "Resolution inleddes",
        "Bolagsverket registrerade att ett resolutionsförfarande hade inletts.",
    ),
}

COMPANY_EVENT_CHANGE_FIELDS = {
    "company_active": "activity_status_code",
    "company_inactive": "activity_status_code",
    "changed_industry": "primary_industry_code",
    "changed_municipality": "seat_municipality_code",
}

GENERIC_COMPANY_EVENT_TITLES = {
    "New company observed",
    "Nytt företag i databasen",
    "Nytt företag i databasen.",
    "Company data changed",
    "Företagsdata ändrades",
    "Registered municipality changed",
    "Registered county changed",
    "Industry changed",
    "Company status changed",
}

GENERIC_COMPANY_EVENT_TYPES = {"new_company", "company_updated"}
GENERIC_COMPANY_EVENT_TITLES_NORMALIZED = {
    value.strip().rstrip(".").casefold()
    for value in GENERIC_COMPANY_EVENT_TITLES
}

BOLAGSVERKET_NAME_TYPE_LABELS = {
    "FORETAGSNAMN-ORGNAM": "Företagsnamn",
    "NAMN-ORGNAM": "Namn",
    "FORNAMN_FRSPRAK-ORGNAM": "Företagsnamn på främmande språk",
    "SARS_FORNAMN-ORGNAM": "Särskilt företagsnamn",
}

IMPORTANT_CHANGE_TITLES = {
    "company_name": "Namn ändrades",
    "registered_name": "Registrerat företagsnamn ändrades",
    "postal_address": "Postadress ändrades",
    "postal_code": "Postnummer ändrades",
    "postal_city": "Postort ändrades",
    "co_address": "C/O-adress ändrades",
    "seat_municipality_code": "Säteskommun ändrades",
    "seat_county_code": "Säteslän ändrades",
    "region_code": "Region ändrades",
    "activity_status_code": "Verksamhetsstatus ändrades",
    "company_state_code": "Bolagsläge ändrades",
    "legal_form_code": "Juridisk form ändrades",
    "organization_form_code": "Organisationsform ändrades",
    "primary_industry_code": "Huvudbransch ändrades",
    "industry_section_code": "Branschavdelning ändrades",
    "employee_size_code": "Antal anställda ändrades",
    "turnover_class_code": "Omsättningsklass ändrades",
    "turnover_detail_class_code": "Detaljerad omsättningsklass ändrades",
    "phone": "Telefon ändrades",
    "email": "E-post ändrades",
}


def _event_source_label(source: str | None) -> str | None:
    if not source:
        return None
    return SOURCE_LABELS.get(source, source)


def _display_change_value(value: str | None, label: str | None) -> str:
    return label or value or "-"


def _has_display_value(value: str | None, label: str | None) -> bool:
    display = label or value
    return bool(display and str(display).strip())


def _event_title(value: str | None) -> str:
    if not value:
        return "Händelse"
    return EVENT_TITLE_LABELS.get(value, value)


def _is_generic_company_event(row) -> bool:
    """Dölj tekniska importhändelser som saknar värde för användaren."""
    if row.get("event_type") in GENERIC_COMPANY_EVENT_TYPES:
        return True
    title = str(row.get("title") or "").strip().rstrip(".").casefold()
    return title in GENERIC_COMPANY_EVENT_TITLES_NORMALIZED


def _change_description(row) -> str:
    before = _display_change_value(row["old_value"], row["old_label"])
    after = _display_change_value(row["new_value"], row["new_label"])
    if before == "-":
        return after
    return f"Från {before} till {after}"


def _matching_event_changes(event_row, changes):
    return [
        change for change in changes
        if (
            event_row["ingestion_run_id"] is not None
            and change["ingestion_run_id"] == event_row["ingestion_run_id"]
        )
        or (
            event_row["ingestion_run_id"] is None
            and change["ingestion_run_id"] is None
            and change["detected_at"] == event_row["detected_at"]
            and change["source"] == event_row["source"]
        )
    ]


def _duplicates_detailed_change(event_row, changes) -> bool:
    """Föredra den detaljerade fältändringen framför en dubblerad händelse."""
    field_name = COMPANY_EVENT_CHANGE_FIELDS.get(event_row.get("event_type"))
    if field_name is None:
        return False
    return any(
        change["field_name"] == field_name
        and _important_change_event(change) is not None
        for change in _matching_event_changes(event_row, changes)
    )


def _turnover_event_details(event_row, changes) -> str | None:
    if "omsättning" not in _event_title(event_row["title"]).casefold():
        return None

    labels = {
        "turnover_class_code": "Omsättningsintervallet",
        "turnover_detail_class_code": "Det detaljerade omsättningsintervallet",
    }
    parts = []
    for field_name, label in labels.items():
        change = next(
            (
                item for item in _matching_event_changes(event_row, changes)
                if item["field_name"] == field_name
                and _has_display_value(item["old_value"], item["old_label"])
                and _has_display_value(item["new_value"], item["new_label"])
            ),
            None,
        )
        if change:
            before = _display_change_value(change["old_value"], change["old_label"])
            after = _display_change_value(change["new_value"], change["new_label"])
            parts.append(f"{label} ändrades från {before} till {after}")

    return ". ".join(parts) + "." if parts else None


def _important_change_event(row):
    field_name = row["field_name"]
    if field_name not in IMPORTANT_CHANGE_TITLES:
        return None

    old_display = _display_change_value(row["old_value"], row["old_label"])
    new_display = _display_change_value(row["new_value"], row["new_label"])
    if old_display == new_display:
        return None

    # En källa som saknar ett fält kan ge "värde -> tomt" i ändringsloggen.
    # Visa inte detta som en affärshändelse utan en separat domänhändelse.
    if not _has_display_value(row["new_value"], row["new_label"]):
        return None

    title = IMPORTANT_CHANGE_TITLES[field_name]
    if not _has_display_value(row["old_value"], row["old_label"]):
        title = title.replace("ändrades", "lades till")

    return {
        "id": f"change:{row['id']}",
        "kind": "change",
        "title": title,
        "description": _change_description(row),
        "effective_at": None,
        "detected_at": row["detected_at"],
        "source": row["source"],
        "source_label": _event_source_label(row["source"]),
        "field_name": field_name,
        "old_value": row["old_value"],
        "new_value": row["new_value"],
        "old_label": row["old_label"],
        "new_label": row["new_label"],
        "importance": row["importance"],
    }


def _registration_names(row) -> list[dict]:
    """Returnera varje relevant registrerat namn en gång, i källans ordning."""
    names = []
    seen = set()
    for index, raw_name in enumerate(row.get("names") or []):
        if not isinstance(raw_name, dict):
            continue
        name = str(raw_name.get("name") or "").strip()
        if not name:
            continue
        name_type_code = str(raw_name.get("name_type_code") or "").strip() or None
        registered_on = raw_name.get("registered_on")
        identity = (_normalized_name(name), str(registered_on or ""), name_type_code)
        if identity in seen:
            continue
        seen.add(identity)
        names.append({
            **raw_name,
            "name": name,
            "name_type_code": name_type_code,
            "registered_on": registered_on,
            "ordinal": raw_name.get("ordinal", index),
        })
    return names


def _registration_primary_name(row) -> tuple[str | None, str | None]:
    names = _registration_names(row)
    if not names:
        return None, None

    preferred = [
        name
        for name in names
        if name.get("name_type_code") == "FORETAGSNAMN-ORGNAM"
    ] or names
    selected = max(
        preferred,
        key=lambda name: str(name.get("registered_on") or ""),
    )
    return (
        selected["name"],
        selected.get("registered_on"),
    )


def _registration_name_title(name: dict) -> str:
    value = name["name"]
    name_type = name.get("name_type_code")
    if name_type == "FORETAGSNAMN-ORGNAM":
        return f"Företagsnamnet {value} registrerades"
    if name_type == "FORNAMN_FRSPRAK-ORGNAM":
        return f"Företagsnamnet {value} registrerades på främmande språk"
    if name_type == "SARS_FORNAMN-ORGNAM":
        return f"Det särskilda företagsnamnet {value} registrerades"
    return f"Namnet {value} registrerades"


def _exact_iso_date(value: object):
    text = str(value or "").strip()
    try:
        return date.fromisoformat(text) if len(text) == 10 else None
    except ValueError:
        return None


def _procedure_effective_date(procedure: dict):
    started_on = procedure.get("started_on")
    if started_on:
        return started_on

    # Äldre importer sparade källvärdet ``kod$datum`` som procedure_text.
    # Tolka bara exakta ISO-datum så att verklig fritext lämnas orörd.
    return _exact_iso_date(procedure.get("procedure_text"))


def _procedure_event_copy(procedure: dict) -> tuple[str, str, str | None]:
    code = str(procedure.get("procedure_code") or "").strip() or None
    procedure_name = (
        str(procedure.get("procedure_name") or "").strip()
        or BOLAGSVERKET_RESTRUCTURING_PROCEDURES.get(code or "")
    )
    raw_text = str(procedure.get("procedure_text") or "").strip()
    detail = raw_text if raw_text and _exact_iso_date(raw_text) is None else None

    if code in PROCEDURE_EVENT_COPY:
        title, description = PROCEDURE_EVENT_COPY[code]
    elif procedure_name:
        title = procedure_name
        description = (
            "Bolagsverket registrerade ett pågående avvecklings- eller "
            "omstruktureringsförfarande."
        )
    else:
        title = "Avvecklings- eller omstruktureringsförfarande"
        description = (
            "Bolagsverket registrerade ett pågående avvecklings- eller "
            "omstruktureringsförfarande."
        )

    return title, detail or description, procedure_name


def _registration_events(row) -> list[dict]:
    """Översätt en registrering till daterade och begripliga händelser."""
    registration = row.get("registration") or {}
    source = row.get("source") or "bolagsverket"
    detected_at = row.get("valid_from")
    version_id = row["registration_version_id"]
    registered_on = registration.get("registered_on")
    deregistered_on = registration.get("deregistered_on")
    description = str(registration.get("business_description") or "").strip()
    names = _registration_names(row)
    registration_name, name_registered_on = _registration_primary_name(row)
    is_active = not bool(deregistered_on)
    common = {
        "kind": "registration",
        "detected_at": detected_at,
        "source": source,
        "source_label": _event_source_label(source),
        "old_value": None,
        "old_label": None,
    }
    items = []

    if registered_on:
        name_was_registered_at_start = (
            registration_name and str(name_registered_on or "") == str(registered_on)
        )
        items.append({
            **common,
            "id": f"registration:{version_id}:registered",
            "title": (
                f"{registration_name} registrerades hos Bolagsverket"
                if name_was_registered_at_start
                else "Företagsregistrering hos Bolagsverket"
            ),
            "description": (
                "Registreringen är fortfarande aktiv hos Bolagsverket."
                if is_active
                else "En ny företagsregistrering skapades hos Bolagsverket."
            ),
            "effective_at": registered_on,
            "field_name": "registered_on",
            "new_value": registered_on,
            "new_label": registration_name if name_was_registered_at_start else None,
            "importance": 3 if is_active else 2,
        })

    represented_name = (
        (_normalized_name(registration_name), str(name_registered_on or ""))
        if registered_on
        and registration_name
        and str(name_registered_on or "") == str(registered_on)
        else None
    )
    for index, name in enumerate(names):
        name_registered_on = name.get("registered_on") or registered_on
        identity = (_normalized_name(name["name"]), str(name_registered_on or ""))
        if represented_name == identity:
            continue
        name_type_label = (
            name.get("name_type_name")
            or BOLAGSVERKET_NAME_TYPE_LABELS.get(name.get("name_type_code"))
            or "Namn"
        )
        items.append({
            **common,
            "id": f"registration:{version_id}:name:{index}",
            "title": _registration_name_title(name),
            "description": (
                f"{name_type_label} kopplades till den aktiva företagsregistreringen."
                if is_active
                else f"{name_type_label} kopplades till företagsregistreringen."
            ),
            "effective_at": name_registered_on,
            "field_name": "registered_name",
            "new_value": name["name"],
            "new_label": name["name"],
            "importance": 3,
        })

    if description:
        items.append({
            **common,
            "id": f"registration:{version_id}:business_description",
            "title": (
                f"Verksamhetsbeskrivning för {registration_name} registrerades"
                if registration_name
                else "Verksamhetsbeskrivning registrerades"
            ),
            "description": description,
            "effective_at": registered_on or name_registered_on,
            "field_name": "business_description",
            "new_value": description,
            "new_label": None,
            "importance": 2,
        })

    if deregistered_on:
        reason_code = registration.get("deregistration_reason_code")
        reason = BOLAGSVERKET_DEREGISTRATION_REASONS.get(reason_code)
        items.append({
            **common,
            "id": f"registration:{version_id}:deregistered",
            "title": (
                f"{registration_name} avregistrerades"
                if registration_name
                else "Företagsregistreringen avregistrerades"
            ),
            "description": (
                f"Orsak enligt Bolagsverket: {reason}."
                if reason
                else "Registreringen avslutades hos Bolagsverket."
            ),
            "effective_at": deregistered_on,
            "field_name": "deregistered_on",
            "new_value": deregistered_on,
            "new_label": reason,
            "importance": 3,
        })

    for index, procedure in enumerate(row.get("procedures") or []):
        if not isinstance(procedure, dict):
            continue
        code = str(procedure.get("procedure_code") or "").strip() or None
        effective_at = _procedure_effective_date(procedure)
        raw_text = str(procedure.get("procedure_text") or "").strip() or None
        if code is None and effective_at is None and raw_text is None:
            continue
        title, procedure_description, procedure_name = _procedure_event_copy(
            procedure
        )
        items.append({
            **common,
            "id": f"procedure:{version_id}:{index}",
            "kind": "procedure",
            "title": title,
            "description": procedure_description,
            "effective_at": effective_at,
            "field_name": "procedure_code",
            "new_value": code,
            "new_label": procedure_name,
            "importance": 3,
        })

    return items


def get_company_event_history(org_nr: str):
    changes_sql = """
    SELECT
      cc.id,
      cc.field_name,
      cc.old_value,
      cc.new_value,
      cc.old_label,
      cc.new_label,
      cc.detected_at,
      cc.ingestion_run_id,
      cc.importance,
      ir.source,
      ir.filename
    FROM app.company_change cc
    LEFT JOIN meta.ingestion_run ir ON ir.id = cc.ingestion_run_id
    WHERE cc.company_id = %(company_id)s
    ORDER BY cc.detected_at DESC, cc.id DESC
    LIMIT 200;
    """

    company_events_sql = """
    SELECT
      e.id,
      e.event_type,
      e.title,
      e.description,
      e.effective_at,
      e.detected_at,
      e.ingestion_run_id,
      e.importance,
      ir.source,
      ir.filename
    FROM app.company_event e
    LEFT JOIN meta.ingestion_run ir ON ir.id = e.ingestion_run_id
    WHERE e.company_id = %(company_id)s
    ORDER BY COALESCE(e.effective_at::timestamptz, e.detected_at) DESC, e.id DESC
    LIMIT 100;
    """

    registrations_sql = """
    SELECT
      registration_version_id,
      source_key,
      source_subkey,
      registration,
      names,
      procedures,
      valid_from,
      last_ingestion_run_id,
      ir.source,
      ir.filename
    FROM app.company_registration r
    LEFT JOIN meta.ingestion_run ir ON ir.id = r.last_ingestion_run_id
    WHERE r.company_id = %(company_id)s
    ORDER BY r.source_subkey, r.valid_from DESC;
    """

    with get_db_connection() as conn, conn.cursor() as cur:
        company_id = resolve_company_id(cur, org_nr)

        cur.execute(changes_sql, {"company_id": company_id})
        changes = cur.fetchall()
        cur.execute(company_events_sql, {"company_id": company_id})
        company_events = cur.fetchall()
        cur.execute(registrations_sql, {"company_id": company_id})
        registrations = cur.fetchall()

    items = []
    kept_company_events = [
        row
        for row in company_events
        if not _is_generic_company_event(row)
        and not _duplicates_detailed_change(row, changes)
    ]
    summarized_turnover_changes = {
        (row["detected_at"], row["source"])
        for row in kept_company_events
        if "omsättning" in _event_title(row["title"]).casefold()
    }

    for row in kept_company_events:
        turnover_description = _turnover_event_details(row, changes)
        items.append({
            "id": f"company_event:{row['id']}",
            "kind": "company_event",
            "title": _event_title(row["title"]),
            "description": (
                turnover_description
                or COMPANY_EVENT_DESCRIPTIONS.get(row["title"])
                or row["description"]
            ),
            "effective_at": row["effective_at"],
            "detected_at": row["detected_at"],
            "source": row["source"],
            "source_label": _event_source_label(row["source"]),
            "field_name": None,
            "old_value": None,
            "new_value": None,
            "old_label": None,
            "new_label": None,
            "importance": row["importance"],
        })

    for row in changes:
        if (
            row["field_name"] in {"turnover_class_code", "turnover_detail_class_code"}
            and (row["detected_at"], row["source"]) in summarized_turnover_changes
        ):
            continue

        event = _important_change_event(row)
        if event:
            items.append(event)

    for row in registrations:
        items.extend(_registration_events(row))

    def sort_key(item):
        value = item["effective_at"] or item["detected_at"]
        return value.isoformat() if hasattr(value, "isoformat") else str(value or "")

    return {
        "items": sorted(
            items,
            key=sort_key,
            reverse=True,
        )[:250]
    }
