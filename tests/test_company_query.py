from api.services.company_service import (
    COUNT_COMPANY_SOURCE_SQL,
    NEVER_ACTIVE_STATUS_CODE,
    _activity_status_filter,
    _company_order_sql,
    _filtered_companies_cte,
    _unfiltered_page_sql,
)


def test_unfiltered_turnover_sort_pages_before_wide_joins():
    sql = _unfiltered_page_sql("turnover_desc", "asc")

    assert "WITH page_anchor AS MATERIALIZED" in sql
    assert "company_page AS MATERIALIZED" in sql
    assert "state.turnover_class_code::int DESC NULLS LAST" in sql
    assert "LIMIT 1 OFFSET %(offset)s" in sql
    assert sql.index("LIMIT %(limit)s") < sql.index("JOIN app.company_list")


def test_unfiltered_employee_sort_uses_numeric_order():
    sql = _unfiltered_page_sql("size_asc", "desc")

    assert "state.employee_size_code::int ASC NULLS LAST" in sql
    assert "state.company_name DESC NULLS LAST" in sql


def test_default_name_sort_uses_an_index_only_deep_page_anchor():
    sql = _unfiltered_page_sql("none", "asc")

    assert "state.company_name AS sort_company_name" in sql
    assert "LIMIT 1 OFFSET %(offset)s" in sql
    assert "state.company_id >= anchor.company_id" in sql


def test_filtered_text_search_scope_does_not_force_materialization():
    sql = _filtered_companies_cte("WHERE vc.activity_status_code = '1'")

    assert "filtered_companies AS NOT MATERIALIZED" in sql
    assert "SELECT vc.*" in sql
    assert "filtered_company_ids" not in sql


def test_count_source_uses_the_narrow_current_company_state():
    assert "FROM core.company_current" in COUNT_COMPANY_SOURCE_SQL
    assert "seat_county_code AS county_code" in COUNT_COMPANY_SOURCE_SQL
    assert "turnover_class_code AS turnover_size_code" in COUNT_COMPANY_SOURCE_SQL
    assert "app.company_list" not in COUNT_COMPANY_SOURCE_SQL
    assert "company_identifier" not in COUNT_COMPANY_SOURCE_SQL


def test_text_search_keeps_relevance_before_user_selected_sorting():
    order_sql = _company_order_sql(
        has_search=True,
        metric_sort="turnover_desc",
        name_sort="desc",
    )

    assert order_sql.startswith("search_match.search_rank DESC")
    assert order_sql.index("search_match.search_rank") < order_sql.index(
        "vc.turnover_size_code"
    )
    assert order_sql.index("vc.turnover_size_code") < order_sql.index(
        "vc.company_name"
    )


def test_never_active_status_code_matches_the_partial_sort_index_contract():
    assert NEVER_ACTIVE_STATUS_CODE == "0"

    params = {}
    predicate = _activity_status_filter([NEVER_ACTIVE_STATUS_CODE], params)

    assert predicate == "vc.activity_status_code = '0'"
    assert params == {}


def test_other_activity_status_filters_remain_parameterized():
    params = {}
    predicate = _activity_status_filter(["1", "9"], params)

    assert predicate == "vc.activity_status_code = ANY(%(company_status_codes)s)"
    assert params == {"company_status_codes": ["1", "9"]}
