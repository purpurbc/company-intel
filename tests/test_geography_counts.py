from api.services.geography_service import GEOGRAPHY_COUNTS_SQL


def test_geography_counts_use_one_narrow_current_state_scan():
    assert "FROM core.company_current" in GEOGRAPHY_COUNTS_SQL
    assert "GROUP BY GROUPING SETS" in GEOGRAPHY_COUNTS_SQL
    assert "app.company" not in GEOGRAPHY_COUNTS_SQL
    assert "company_identifier" not in GEOGRAPHY_COUNTS_SQL
    assert "'0000', '9999'" in GEOGRAPHY_COUNTS_SQL
    assert "'00', '99'" in GEOGRAPHY_COUNTS_SQL
