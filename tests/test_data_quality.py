from api.services.company_service import (
    _best_effort_filtered_total,
    get_companies,
)
from api.services.data_quality_service import _iso_or_none, metric_coverage
from api.services.sweden_service import VAT_AND_F_TAX_SQL


def test_metric_coverage_distinguishes_missing_base_from_zero_value():
    assert metric_coverage(0, 0)["percent"] is None
    assert metric_coverage(0, 10)["percent"] == 0.0


def test_overview_dates_are_json_serializable():
    from datetime import datetime, timezone

    assert _iso_or_none(datetime(2026, 9, 9, tzinfo=timezone.utc)) == (
        "2026-09-09T00:00:00+00:00"
    )


def test_vat_and_f_tax_are_counted_on_the_same_company_row():
    normalized = " ".join(VAT_AND_F_TAX_SQL.split())
    assert "vat_status_code = '1' AND f_tax_status_code = '1'" in normalized


def test_filtered_total_uses_planner_when_sampling_times_out(monkeypatch):
    monkeypatch.setattr(
        "api.services.company_service._sampled_total",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "api.services.company_service._estimated_total",
        lambda *args, **kwargs: 37,
    )

    assert _best_effort_filtered_total(
        object(),
        predicates=["vc.company_state_code = ANY(%(codes)s)"],
        estimate_sql="SELECT 1",
        params={"codes": ["0"]},
        minimum_total=50,
    ) == 50


def test_company_age_filter_uses_stockholm_date(monkeypatch):
    class Cursor:
        def __init__(self):
            self.sql = []

        def execute(self, sql, params=None):
            self.sql.append(str(sql))

        def fetchall(self):
            return []

        def fetchone(self):
            return {"total": 0}

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    class Connection:
        def __init__(self):
            self.cursor_instance = Cursor()

        def cursor(self):
            return self.cursor_instance

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    connection = Connection()
    monkeypatch.setattr(
        "api.services.company_service.get_db_connection", lambda: connection
    )

    get_companies(
        q=None,
        search_by="all",
        county_codes=None,
        municipality_codes=None,
        company_status_codes=None,
        company_state_codes=None,
        employer_status_codes=None,
        vat_status_codes=None,
        f_tax_status_codes=None,
        marketing_status_codes=None,
        size_class_codes=None,
        age_min=2,
        age_max=4,
        post_ort=None,
        post_nr=None,
        owner_category_codes=None,
        sme_size_codes=None,
        export_import_marks=None,
        section_codes=None,
        industry_codes=None,
        industry_detail_codes=None,
        turnover_size_codes=None,
        name_sort="asc",
        metric_sort="none",
        limit=10,
        offset=0,
    )

    data_sql = next(
        sql
        for sql in connection.cursor_instance.sql
        if "company_page AS MATERIALIZED" in sql
    )
    assert "Europe/Stockholm" in data_sql
    assert "COALESCE(vc.start_date, vc.scb_registration_date)" in data_sql
    assert "make_interval(years => %(age_min)s))::date" in data_sql
    assert "EXTRACT" not in data_sql
    assert any("SET LOCAL jit = off" in sql for sql in connection.cursor_instance.sql)


def test_unfiltered_total_counts_the_narrow_identity_table(monkeypatch):
    class Cursor:
        def __init__(self):
            self.sql = []

        def execute(self, sql, params=None):
            self.sql.append(str(sql))

        def fetchone(self):
            return {"total": 42}

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    class Connection:
        def __init__(self):
            self.cursor_instance = Cursor()

        def cursor(self):
            return self.cursor_instance

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    connection = Connection()
    monkeypatch.setattr(
        "api.services.company_service.get_db_connection", lambda: connection
    )

    response = get_companies(
        q=None,
        search_by="all",
        county_codes=None,
        municipality_codes=None,
        company_status_codes=None,
        company_state_codes=None,
        employer_status_codes=None,
        vat_status_codes=None,
        f_tax_status_codes=None,
        marketing_status_codes=None,
        size_class_codes=None,
        age_min=None,
        age_max=None,
        post_ort=None,
        post_nr=None,
        owner_category_codes=None,
        sme_size_codes=None,
        export_import_marks=None,
        section_codes=None,
        industry_codes=None,
        industry_detail_codes=None,
        turnover_size_codes=None,
        name_sort="asc",
        metric_sort="none",
        limit=1,
        offset=0,
        include_total=True,
        count_only=True,
    )

    assert response["total"] == 42
    assert any(
        "FROM core.company_current" in sql
        for sql in connection.cursor_instance.sql
    )
