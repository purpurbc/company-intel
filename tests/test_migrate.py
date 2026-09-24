import os
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo

from db.migrate import (
    CURRENT_BASELINE_MIGRATION,
    PREVIOUS_TERMINAL_MIGRATION,
    _previous_chain_is_complete,
    migrate,
)


def test_empty_or_current_ledger_does_not_adopt_baseline():
    assert _previous_chain_is_complete({}) is False
    assert _previous_chain_is_complete({CURRENT_BASELINE_MIGRATION: 'checksum'}) is False


def test_complete_previous_chain_can_adopt_current_baseline():
    assert _previous_chain_is_complete({PREVIOUS_TERMINAL_MIGRATION: 'checksum'}) is True


def test_partial_previous_chain_is_rejected():
    with pytest.raises(RuntimeError, match='partially applied pre-squash'):
        _previous_chain_is_complete({'100_platform_baseline.sql': 'checksum'})


def test_current_baseline_creates_ready_empty_schema():
    base_url = os.environ.get('TEST_DATABASE_URL')
    if not base_url:
        pytest.skip('Set TEST_DATABASE_URL to a disposable local PostgreSQL instance')
    database_name = 'company_intel_baseline_' + uuid4().hex
    database_url = make_conninfo(**(conninfo_to_dict(base_url) | {'dbname': database_name}))
    with psycopg.connect(base_url, autocommit=True) as admin:
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database_name)))
    try:
        with psycopg.connect(database_url, autocommit=True) as conn:
            migrate(conn)
            assert conn.execute('SELECT count(*) FROM meta.source').fetchone()[0] == 5
            assert conn.execute("SELECT count(*) FROM meta.code WHERE source IN ('bolagsverket', 'bolagsverket_statistics')").fetchone()[0] == 99
            assert conn.execute('SELECT count(*) FROM mart.bolagsverket_company_statistics_monthly').fetchone()[0] == 0
            assert conn.execute('SELECT count(*) FROM mart.bolagsverket_representative_statistics_yearly').fetchone()[0] == 0
            assert conn.execute("SELECT to_regclass('app.sales_offer')").fetchone()[0] is None
            assert conn.execute("SELECT to_regclass('app.saved_segment')").fetchone()[0] is not None
    finally:
        with psycopg.connect(base_url, autocommit=True) as admin:
            admin.execute(sql.SQL('DROP DATABASE {} WITH (FORCE)').format(sql.Identifier(database_name)))
