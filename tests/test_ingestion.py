import os
from dataclasses import replace
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from psycopg.rows import dict_row

from db.migrate import migrate
from worker.bulk_files.parser import SourceRow, parse_bolagsverket_bulk_row, parse_scb_bulk_row
from worker.ingest.adapters import api_record, bolagsverket_record, scb_bulk_record
from worker.ingest.repository import load_batch
from worker.ingest.runs import checkpoint, finish_run, resume_or_start, start_run


@pytest.fixture
def database_url():
    base = os.environ.get('TEST_DATABASE_URL')
    if not base:
        pytest.skip('Set TEST_DATABASE_URL to a disposable local PostgreSQL instance')
    name = 'company_intel_test_' + uuid4().hex
    with psycopg.connect(base, autocommit=True) as admin:
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(name)))
    url = make_conninfo(**(conninfo_to_dict(base) | {'dbname': name}))
    try:
        with psycopg.connect(url, autocommit=True) as conn:
            migrate(conn)
        yield url
    finally:
        with psycopg.connect(base, autocommit=True) as admin:
            admin.execute(sql.SQL('DROP DATABASE {} WITH (FORCE)').format(sql.Identifier(name)))


@pytest.fixture
def db(database_url):
    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        yield conn


def scb_payload(**changes):
    return dict(PeOrgNr='199001010011', Namn='Test Person', Foretagsnamn='Test Shop',
                FtgStat='1', JEStat='2', JurForm='10', Ng1='47910', Ng2='74110',
                PostNr='70280', PostOrt='TESTORT', Gatuadress='Testgatan 1', **changes)


def bulk(payload=None, row=2):
    return scb_bulk_record(parse_scb_bulk_row(SourceRow('scb.txt', row, payload or scb_payload())))


def bv(sequence='1', name='Test Shop', description='Design', row=2):
    payload = {
        'organisationsidentitet': '199001010011$PERSON-IDORG', 'namnskyddslopnummer': sequence,
        'organisationsnamn': f'{name}$FORETAGSNAMN-ORGNAM$2025-05-23',
        'organisationsform': 'E-ORGFO', 'verksamhetsbeskrivning': description,
        'registreringsdatum': '2025-05-23', 'postadress': 'Testgatan 2$$TESTORT$70280$SE-LAND',
    }
    return bolagsverket_record(parse_bolagsverket_bulk_row(SourceRow('bv.txt', row, payload)))


def ingest(db, source, records):
    run = start_run(db, source)
    result = load_batch(db, source, run, records)
    checkpoint(db, run, max(r.row_number for r in records), result)
    finish_run(db, run)
    db.commit()
    return result


def scalar(db, query):
    return next(iter(db.execute(query).fetchone().values()))


def test_person_firms_and_scb_precedence(db):
    ingest(db, 'scb_api', [api_record({
        'PeOrgNr': '199001010011', 'OrgNr': '9001010011', 'Företagsnamn': 'API Person',
        'Firma': 'API Shop', 'PostOrt': 'API CITY', 'Telefon': None,
        'Bransch_1, kod': '47910',
    }, 1, sni_version='2025')])
    ingest(db, 'scb_bulk', [bulk()])
    ingest(db, 'bolagsverket', [bv(), bv(sequence='2', name='Other Shop', row=3)])
    row = db.execute('SELECT * FROM app.company').fetchone()
    assert scalar(db, 'SELECT count(*) FROM core.company') == 1
    assert row['company_name'] == 'API Person'
    assert row['registered_name'] == 'API Shop'
    assert row['postal_city'] == 'API CITY'
    assert row['pe_org_nr'] == '199001010011'
    assert scalar(db, 'SELECT count(*) FROM app.company_registration') == 2
    assert scalar(db, 'SELECT count(*) FROM core.company_industry_history WHERE valid_to IS NULL') == 2


def test_scd2_identical_import_and_changed_import(db):
    record = bulk()
    ingest(db, 'scb_bulk', [record])
    ingest(db, 'scb_bulk', [record])
    assert scalar(db, 'SELECT count(*) FROM src_scb.company_history') == 1
    assert scalar(db, 'SELECT count(*) FROM core.company_state_history') == 1
    assert scalar(db, 'SELECT count(*) FROM raw.company_record') == 2
    changed = bulk(scb_payload() | {'PostOrt': 'NEW CITY'})
    ingest(db, 'scb_bulk', [changed])
    assert scalar(db, 'SELECT count(*) FROM core.company_state_history') == 2
    intervals = db.execute('SELECT valid_from, valid_to FROM core.company_state_history ORDER BY valid_from').fetchall()
    assert intervals[0]['valid_to'] == intervals[1]['valid_from']
    assert intervals[1]['valid_to'] is None
    assert scalar(db, "SELECT new_value FROM core.company_change WHERE field_name = 'postal_city'") == 'NEW CITY'


def test_one_ingestion_run_uses_one_observation_time(db):
    run_id = start_run(db, 'scb_bulk')
    db.commit()
    first = bulk(row=2)
    second = bulk(
        scb_payload() | {'PeOrgNr': '198001010019', 'Namn': 'Second Company'},
        row=3,
    )

    for record in (first, second):
        result = load_batch(db, 'scb_bulk', run_id, [record])
        checkpoint(db, run_id, record.row_number, result)
        db.commit()

    finish_run(db, run_id)
    db.commit()
    run_started_at = db.execute(
        'SELECT started_at FROM meta.ingestion_run WHERE id = %s',
        (run_id,),
    ).fetchone()['started_at']
    raw_observations = db.execute(
        'SELECT observed_at FROM raw.company_record ORDER BY row_number'
    ).fetchall()
    state_observations = db.execute(
        'SELECT valid_from FROM core.company_state_history ORDER BY company_id'
    ).fetchall()

    assert {row['observed_at'] for row in raw_observations} == {run_started_at}
    assert {row['valid_from'] for row in state_observations} == {run_started_at}


def test_overview_cache_has_hard_expiry(db, database_url):
    from api.services.overview_cache import get_overview_cache, set_overview_cache

    def connect():
        return psycopg.connect(database_url, row_factory=dict_row)

    set_overview_cache('test:v1', {'ok': True}, connection_factory=connect)
    assert get_overview_cache('test:v1', connection_factory=connect) == {'ok': True}

    db.execute(
        "UPDATE app.overview_cache SET expires_at = current_timestamp - interval '1 second' "
        "WHERE scope = 'test:v1'"
    )
    db.commit()
    assert get_overview_cache('test:v1', connection_factory=connect) is None


def test_nul_preserved_in_raw_and_removed_from_normalized(db):
    ingest(db, 'bolagsverket', [bv(description='Design\x00 and print | $')])
    assert '\\u0000' in scalar(db, 'SELECT payload::text FROM raw.company_record')
    assert scalar(db, "SELECT registration->>'business_description' FROM app.company_registration") == 'Design and print | $'
    assert scalar(db, 'SELECT count(*) FROM meta.data_quality_issue') == 1
    with pytest.raises(psycopg.errors.RaiseException):
        db.execute("DELETE FROM raw.company_record")
    db.rollback()


def test_omitted_api_field_kept_explicit_null_cleared(db):
    first = {'PeOrgNr': '199001010011', 'Företagsnamn': 'API Person', 'Telefon': '123', 'PostOrt': 'CITY'}
    ingest(db, 'scb_api', [api_record(first, 1)])
    ingest(db, 'scb_api', [api_record({'PeOrgNr': first['PeOrgNr'], 'Telefon': None}, 1)])
    row = db.execute('SELECT * FROM app.company').fetchone()
    assert row['company_name'] == 'API Person'
    assert row['postal_city'] == 'CITY'
    assert row['phone'] is None


def test_full_person_identity_prevents_century_collision(db):
    a = bulk()
    b = bulk(scb_payload() | {'PeOrgNr': '189001010011'}, row=3)
    ingest(db, 'scb_bulk', [a, b])
    assert scalar(db, 'SELECT count(*) FROM core.company') == 2


def test_failed_batch_does_not_advance_checkpoint(db):
    run = start_run(db, 'scb_bulk')
    db.commit()
    bad = replace(bulk(), data=bulk().data | {'workplace_count': -1})
    with pytest.raises(psycopg.errors.CheckViolation):
        load_batch(db, 'scb_bulk', run, [bad])
    db.rollback()
    assert scalar(db, 'SELECT last_row_number FROM meta.ingestion_run') == 0
    assert scalar(db, 'SELECT count(*) FROM raw.company_record') == 0
    assert scalar(db, 'SELECT count(*) FROM core.company') == 0


def test_resume_is_scoped_to_checksum_and_filter(db):
    args = dict(filename='same.zip', checksum='a', metadata={'identity_types': ['PERSON-IDORG']}, resume=True)
    one, _, _ = resume_or_start(db, 'bolagsverket', **args)
    db.execute('UPDATE meta.ingestion_run SET last_row_number = 100 WHERE id = %s', (one,))
    db.commit()
    again, last, _ = resume_or_start(db, 'bolagsverket', **args)
    assert (again, last) == (one, 100)
    two, last, _ = resume_or_start(db, 'bolagsverket', **(args | {'checksum': 'b'}))
    assert two != one and last == 0
    three, last, _ = resume_or_start(db, 'bolagsverket', **(args | {'metadata': {'identity_types': ['ORGNR-IDORG']}}))
    assert three not in (one, two) and last == 0
    four, last, _ = resume_or_start(db, 'bolagsverket', dataset='statistics', **args)
    assert four not in (one, two, three) and last == 0


def test_statistics_file_import_preserves_changed_and_removed_history(
    db, database_url, monkeypatch, tmp_path
):
    from api.services.bolagsverket_statistics_service import (
        get_bolagsverket_statistics_overview,
    )
    from worker import database
    from worker.bolagsverket_statistics.importer import (
        BolagsverketStatisticsImporter,
    )

    monkeypatch.setattr(
        database,
        'get_db_connection',
        lambda: psycopg.connect(database_url, row_factory=dict_row),
    )
    path = tmp_path / 'rev_forbehall.csv'
    header = (
        'Registreringsar_NO;AktiebolagLagerbolagNYB;Antal_foretag_CNT;'
        'Antal_foretag_rev_nyb_CNT;Antal_foretag_rev_forb_CNT;'
        'Antal_foretag_rev_forb_utan_CNT;Andel_med_revisorsforb_CNT;'
        'Andel_utan_rev_med_forb_CNT\n'
    )
    path.write_text(
        header
        + '2012;Aktiebolag;100;20;30;10;0,3000;0,1250\n'
        + '2012;Lagerbolag;50;2;4;2;0,0800;0,0417\n',
        encoding='utf-8',
    )
    importer = BolagsverketStatisticsImporter(batch_size=1, progress_every=100)
    first = importer.import_file('auditor_reservations', path)
    assert first == {
        'records_seen': 2,
        'records_new': 2,
        'records_changed': 0,
        'records_removed': 0,
        'records_unchanged': 0,
        'snapshot_rows': 2,
    }

    path.write_text(
        header
        + '2012;Aktiebolag;110;21;31;10;0,2818;0,1124\n'
        + '2026;Aktiebolag;120;22;32;10;0,2667;0,1020\n',
        encoding='utf-8',
    )
    second = importer.import_file('auditor_reservations', path)
    assert second['records_new'] == 1
    assert second['records_changed'] == 1
    assert second['records_removed'] == 1
    assert second['records_unchanged'] == 0
    assert scalar(db, 'SELECT count(*) FROM raw.statistics_record') == 4
    assert scalar(db, 'SELECT count(*) FROM src_bolagsverket.statistics_history') == 4
    assert scalar(db, 'SELECT count(*) FROM app.bolagsverket_auditor_reservation_statistics') == 2
    assert scalar(db, "SELECT count(*) FROM src_bolagsverket.statistics_history WHERE valid_to IS NOT NULL") == 2

    repeated = importer.import_file('auditor_reservations', path)
    assert repeated == second
    assert scalar(db, "SELECT count(*) FROM meta.ingestion_run WHERE source = 'bolagsverket_statistics'") == 2

    def connect_for_api():
        return psycopg.connect(
            database_url,
            row_factory=dict_row,
            options='-c search_path=app,extensions,pg_catalog',
        )

    overview = get_bolagsverket_statistics_overview(
        connection_factory=connect_for_api,
    )
    assert [row['year'] for row in overview['auditor_reservations']] == [2026, 2012]
    assert overview['auditor_reservations'][0]['formation_type_name'] == 'Aktiebolag'


def test_statistics_snapshot_guard_keeps_current_data_until_approved(
    db, database_url, monkeypatch, tmp_path
):
    from worker import database
    from worker.bolagsverket_statistics.importer import (
        BolagsverketStatisticsImporter,
    )
    from worker.bolagsverket_statistics.repository import SnapshotRemovalError

    monkeypatch.setattr(
        database,
        'get_db_connection',
        lambda: psycopg.connect(database_url, row_factory=dict_row),
    )
    path = tmp_path / 'rev_forbehall.csv'
    header = (
        'Registreringsar_NO;AktiebolagLagerbolagNYB;Antal_foretag_CNT;'
        'Antal_foretag_rev_nyb_CNT;Antal_foretag_rev_forb_CNT;'
        'Antal_foretag_rev_forb_utan_CNT;Andel_med_revisorsforb_CNT;'
        'Andel_utan_rev_med_forb_CNT\n'
    )
    row = '{year};Aktiebolag;100;20;30;10;0,3000;0,1250\n'
    path.write_text(
        header + ''.join(row.format(year=year) for year in range(2010, 2022)),
        encoding='utf-8',
    )
    importer = BolagsverketStatisticsImporter(batch_size=4, progress_every=100)
    importer.import_file('auditor_reservations', path)

    path.write_text(header + row.format(year=2021), encoding='utf-8')
    with pytest.raises(SnapshotRemovalError):
        importer.import_file('auditor_reservations', path)
    assert scalar(db, 'SELECT count(*) FROM app.bolagsverket_auditor_reservation_statistics') == 12
    assert scalar(db, "SELECT count(*) FROM src_bolagsverket.statistics_import_stage") == 1

    result = importer.import_file(
        'auditor_reservations', path, allow_large_removal=True
    )
    assert result['records_removed'] == 11
    assert scalar(db, 'SELECT count(*) FROM app.bolagsverket_auditor_reservation_statistics') == 1
    assert scalar(db, "SELECT count(*) FROM src_bolagsverket.statistics_import_stage") == 0


def test_bolagsverket_names_are_versioned(db):
    ingest(db, 'bolagsverket', [bv()])
    ingest(db, 'bolagsverket', [bv(name='Changed Name')])
    assert scalar(db, 'SELECT count(*) FROM src_bolagsverket.organization_name_history') == 2
    assert scalar(db, "SELECT name FROM core.company_name_history WHERE valid_to IS NULL") == 'Changed Name'


def test_bulk_advertising_is_not_api_reklam(db):
    ingest(db, 'scb_bulk', [bulk(scb_payload() | {'Reklamsparrtyp': '2'})])
    row = db.execute('SELECT * FROM app.company').fetchone()
    assert row['advertising_status_code'] is None
    assert row['bulk_advertising_status_code'] == '2'


def test_api_profile_search_and_detail(db, database_url, monkeypatch):
    import inspect
    from api.services import company_service, profile_service, option_service, sweden_service

    def connect():
        return psycopg.connect(database_url, row_factory=dict_row, options='-c search_path=app,pg_catalog')

    for module in (company_service, profile_service, option_service, sweden_service):
        monkeypatch.setattr(module, 'get_db_connection', connect)
    ingest(db, 'scb_bulk', [bulk()])
    ingest(db, 'bolagsverket', [bv()])
    profile = profile_service.update_app_user({'company_org_nr': '199001010011', 'company_description': 'My company'})
    assert profile['company_name'] == 'Test Person'
    args = {key: None for key in inspect.signature(company_service.get_companies).parameters}
    args.update(
        q='Test Shop', search_by='company_name', limit=10, offset=0,
        name_sort='asc', metric_sort='none', include_total=True,
    )
    assert company_service.get_companies(**args)['total'] == 1
    args.update(q=None, industry_codes=['74'])
    assert company_service.get_companies(**args)['total'] == 1
    detail = company_service.get_company_by_orgnr('199001010011')
    assert detail['business_description'] == 'Design'
    assert detail['registrations'][0]['registration']['business_description'] == 'Design'
    assert len(detail['industries']) == 2
    assert sweden_service.get_sweden_overview()['totals']['companies'] == 1
    assert len(option_service.get_counties()) >= 21


def test_company_search_handles_identity_name_variations_and_short_input(
    db, database_url, monkeypatch
):
    import inspect
    from api.services import company_service

    monkeypatch.setattr(
        company_service,
        'get_db_connection',
        lambda: psycopg.connect(
            database_url,
            row_factory=dict_row,
            options='-c search_path=app,pg_catalog',
        ),
    )
    anna = bulk(
        scb_payload()
        | {
            'Namn': 'Bergström, Anna',
            'Foretagsnamn': 'Bergström, Anna',
        },
        row=2,
    )
    vexa = bulk(
        scb_payload()
        | {
            'PeOrgNr': '198001010019',
            'Namn': 'Vexa Företagen AB',
            'Foretagsnamn': 'Vexa Företagen AB',
        },
        row=3,
    )
    ingest(db, 'scb_bulk', [anna, vexa])

    base = {
        key: None for key in inspect.signature(company_service.get_companies).parameters
    }
    base.update(
        search_by='all',
        limit=20,
        offset=0,
        name_sort='asc',
        metric_sort='none',
        include_total=True,
        count_only=False,
    )

    def names(query):
        result = company_service.get_companies(**(base | {'q': query}))
        assert result['total'] is not None
        return [item['company_name'] for item in result['items']]

    assert names('9001010011') == ['Bergström, Anna']
    assert 'Vexa Företagen AB' in names('Vexa AB')
    assert names('Anna Bergström') == ['Bergström, Anna']
    assert names('Bergstrm Anna')[0] == 'Bergström, Anna'
    assert names('Bergstrom Anna')[0] == 'Bergström, Anna'
    assert names('V')[0] == 'Vexa Företagen AB'


def test_file_import_resume_and_new_week_same_filename(db, database_url, monkeypatch, tmp_path):
    from worker import database
    from worker.bulk_files.importer import BulkCompanyFileImporter

    monkeypatch.setattr(database, 'get_db_connection', lambda: psycopg.connect(database_url, row_factory=dict_row))
    path = tmp_path / 'scb.txt'
    path.write_text('PeOrgNr\tNamn\tPostOrt\n199001010011\tTest Person\tCITY A\n', encoding='utf-8')
    importer = BulkCompanyFileImporter(batch_size=1, progress_every=1)
    assert importer.import_scb_bulk_file(path, resume=True)['records_seen'] == 1
    assert importer.import_scb_bulk_file(path, resume=True)['records_seen'] == 0
    path.write_text('PeOrgNr\tNamn\tPostOrt\n199001010011\tTest Person\tCITY B\n', encoding='utf-8')
    assert importer.import_scb_bulk_file(path, resume=True)['records_changed'] == 1
    assert scalar(db, 'SELECT count(*) FROM meta.ingestion_run') == 2


def test_interrupted_file_import_replays_only_uncommitted_batch(db, database_url, monkeypatch, tmp_path):
    from worker import database
    from worker.bulk_files import importer as module

    monkeypatch.setattr(database, 'get_db_connection', lambda: psycopg.connect(database_url, row_factory=dict_row))
    path = tmp_path / 'scb.txt'
    path.write_text('PeOrgNr\tNamn\n199001010011\tOne\n199001010012\tTwo\n', encoding='utf-8')
    real_load = module.load_batch
    calls = []

    def interrupt(conn, source, run_id, records):
        calls.append(records[0].row_number)
        if len(calls) == 2:
            raise KeyboardInterrupt()
        return real_load(conn, source, run_id, records)

    monkeypatch.setattr(module, 'load_batch', interrupt)
    importer = module.BulkCompanyFileImporter(batch_size=1, progress_every=1)
    with pytest.raises(KeyboardInterrupt):
        importer.import_scb_bulk_file(path)
    assert scalar(db, 'SELECT last_row_number FROM meta.ingestion_run') == 2
    assert scalar(db, 'SELECT status FROM meta.ingestion_run') == 'interrupted'
    monkeypatch.setattr(module, 'load_batch', real_load)
    assert importer.import_scb_bulk_file(path, resume=True)['records_seen'] == 1
    assert scalar(db, 'SELECT count(*) FROM raw.company_record') == 2
    assert scalar(db, 'SELECT status FROM meta.ingestion_run') == 'done'


def test_scb_incomplete_partition_retains_raw_and_fails_run(db, database_url, monkeypatch):
    from worker.scb import company_importer as module

    class Client:
        def _post_Je_HamtaForetag(self, **kwargs):
            return [{'PeOrgNr': '199001010011', 'Företagsnamn': 'Test Person'}]

    monkeypatch.setattr(module, 'get_db_connection', lambda: psycopg.connect(database_url, row_factory=dict_row))
    importer = module.SCBCompanyImporter(Client())
    monkeypatch.setattr(importer, '_get_company_partitions', lambda **kwargs: ([{'cats': [], 'num_co': 2}], [], [], [], 2))
    with pytest.raises(RuntimeError, match='expected 2'):
        importer.seed_all_companies()
    assert scalar(db, 'SELECT count(*) FROM raw.scb_api_company') == 1
    assert scalar(db, 'SELECT count(*) FROM core.company') == 0
    assert scalar(db, 'SELECT status FROM meta.ingestion_run') == 'failed'


def test_ambiguous_short_identity_is_rejected(db):
    from fastapi import HTTPException
    from api.services.company_identity import resolve_company_id

    ingest(db, 'scb_bulk', [bulk(), bulk(scb_payload() | {'PeOrgNr': '189001010011'}, row=3)])
    with db.cursor() as cur:
        with pytest.raises(HTTPException) as error:
            resolve_company_id(cur, '9001010011')
        assert error.value.status_code == 409
        assert resolve_company_id(cur, '199001010011') != resolve_company_id(cur, '189001010011')


def test_parser_dialects_and_utf8_sample_boundary(tmp_path):
    from worker.bulk_files.parser import detect_text_encoding, iter_delimited_rows

    assert detect_text_encoding(b'abc\xc3') in ('utf-8', 'utf-8-sig')
    scb = tmp_path / 'scb.txt'
    scb.write_text('PeOrgNr\tNamn\n199001010011\t"Quoted" name\n', encoding='utf-8')
    assert next(iter_delimited_rows(scb, '\t')).payload['Namn'] == '"Quoted" name'
    bv_path = tmp_path / 'bv.txt'
    bv_path.write_text('name;description;address\n"Test";"A trailing \\"";"Street"\n', encoding='utf-8')
    row = next(iter_delimited_rows(bv_path, ';')).payload
    assert row == {'name': 'Test', 'description': 'A trailing "', 'address': 'Street'}


def test_overlapping_api_partitions_are_rejected(db):
    run = start_run(db, 'scb_api')
    payload = {'PeOrgNr': '199001010011', 'Företagsnamn': 'Test Person'}
    load_batch(db, 'scb_api', run, [api_record(payload, 1)])
    db.commit()
    with pytest.raises(ValueError, match='overlap'):
        load_batch(db, 'scb_api', run, [api_record(payload, 2)])
    db.rollback()


def test_removed_crm_and_watch_tables_are_absent(db):
    for relation in (
        "app.customer_account",
        "app.sales_offer",
        "app.sales_offer_customer",
        "app.watched_company",
    ):
        row = db.execute("SELECT to_regclass(%s) AS relation", (relation,)).fetchone()
        assert row["relation"] is None


def test_turnover_history_keeps_latest_value_in_same_year(db, database_url, monkeypatch):
    from fastapi import HTTPException
    from api.services import company_service

    monkeypatch.setattr(company_service, 'get_db_connection', lambda: psycopg.connect(
        database_url, row_factory=dict_row, options='-c search_path=app,pg_catalog'))
    base = {'PeOrgNr': '199001010011', 'Företagsnamn': 'Test Person', 'Omsättning, år': 2025}
    ingest(db, 'scb_api', [api_record(base | {'Stkl, oms, kod': '0'}, 1)])
    ingest(db, 'scb_api', [api_record(base | {'Stkl, oms, kod': '1'}, 1)])
    rows = company_service.get_company_turnover_history('199001010011')['items']
    assert len(rows) == 1 and rows[0]['turnover_size_code'] == '1'
    assert company_service.get_company_by_orgnr('199001010099') is None
    with pytest.raises(HTTPException) as error:
        company_service.get_company_turnover_history('199001010099')
    assert error.value.status_code == 404


def test_unknown_api_sni_edition_is_not_mixed_with_2025_bulk(db):
    ingest(db, 'scb_bulk', [bulk()])
    ingest(db, 'scb_api', [api_record({'PeOrgNr': '199001010011', 'Bransch_1, kod': '47910'}, 1)])
    rows = db.execute('SELECT * FROM core.company_industry_history WHERE valid_to IS NULL').fetchall()
    assert len(rows) == 1
    assert rows[0]['sni_version'] == 'unknown'


def test_short_bolagsverket_person_identity_is_preserved_without_guessing(db):
    from api.services.company_identity import resolve_company_id

    ingest(db, 'scb_bulk', [bulk()])
    payload = bv().payload | {'organisationsidentitet': '9001010011$PERSON-IDORG'}
    record = bolagsverket_record(parse_bolagsverket_bulk_row(SourceRow('bv.txt', 2, payload)))
    ingest(db, 'bolagsverket', [record])
    assert scalar(db, 'SELECT count(*) FROM core.company') == 2
    row = db.execute("SELECT * FROM app.company WHERE identity_type = 'PERSON_SHORT'").fetchone()
    assert row['pe_org_nr'] is None
    assert row['org_nr'] == '9001010011'
    assert scalar(db, "SELECT issue_code FROM meta.data_quality_issue") == 'short_person_identity'
    with db.cursor() as cur:
        assert resolve_company_id(cur, f'id:{row["company_id"]}') == row['company_id']


def test_foreign_postal_code_is_not_stripped_to_digits():
    from worker.bulk_files.parser import parse_postal_address

    address = parse_postal_address('Example Road$$LONDON$NW10 8NN$GB-LAND')
    assert address['postal_city'] == 'LONDON'
    assert address['postal_code'] == 'NW10 8NN'


def test_equal_api_value_replaces_bulk_provenance_without_false_field_change(db):
    ingest(db, 'scb_bulk', [bulk()])
    payload = {'PeOrgNr': '199001010011', 'Företagsnamn': 'Test Person'}
    ingest(db, 'scb_api', [api_record(payload, 1)])
    assert scalar(db, 'SELECT count(*) FROM core.company_state_history') == 2
    assert scalar(db, "SELECT provenance->'company_name'->>'source' FROM core.company_current") == 'scb_api'
    assert scalar(db, 'SELECT count(*) FROM core.company_change') == 0
    ingest(db, 'scb_api', [api_record(payload, 1)])
    assert scalar(db, 'SELECT count(*) FROM core.company_state_history') == 2


def test_later_bv_delivery_does_not_remove_missing_name(db):
    ingest(db, 'bolagsverket', [bv()])
    ingest(db, 'bolagsverket', [bv(sequence='2', name='Other Shop')])
    assert scalar(db, 'SELECT company_name FROM core.company_current') == 'Test Shop'
    assert scalar(db, "SELECT count(*) FROM core.company_change WHERE field_name = 'company_name'") == 0


def test_api_identity_validated_before_text_cleanup():
    with pytest.raises(ValueError, match='12 digits'):
        api_record({'PeOrgNr': '19900101\x000011'}, 1)
    record = api_record({'PeOrgNr': '19900101-0011'}, 1)
    assert record.source_key == '199001010011'


def test_missing_population_outside_api_partitions_is_imported_as_partial(db, database_url, monkeypatch):
    from worker.scb import company_importer as module
    from worker.scb.models.category import Category

    class Client:
        def _get_Je_KategorierMedKodtabeller(self):
            return [{'Id_Kategori_JE': Category.SEAT_MUNICIPALITY.value,
                     'VardeLista': [{'Varde': '1880', 'Text': 'Test'}]}]

        def _post_Je_RaknaForetag(self, **kwargs):
            return 3

        def _post_Je_HamtaForetag(self, **kwargs):
            return [
                {'PeOrgNr': '199001010011', 'Företagsnamn': 'Test 1'},
                {'PeOrgNr': '189001010011', 'Företagsnamn': 'Test 2'},
            ]

    monkeypatch.setattr(module, 'PARTITIONS', {0: {
        'cat': Category.SEAT_MUNICIPALITY, 'active_value': 0, 'current_sum': 0,
    }})
    monkeypatch.setattr(module, 'get_db_connection', lambda: psycopg.connect(database_url, row_factory=dict_row))
    importer = module.SCBCompanyImporter(Client())
    monkeypatch.setattr(importer, '_partition', lambda *args, **kwargs: ([{'cats': [], 'num_co': 2}], [], [], []))
    importer.seed_all_companies()
    run = db.execute('SELECT status, metadata FROM meta.ingestion_run').fetchone()
    assert run['status'] == 'partial'
    assert run['metadata']['partition_coverage'] == {
        'expected': 3, 'covered': 2, 'insufficient_partitions': 1,
    }
    assert scalar(db, 'SELECT count(*) FROM core.company') == 2


def test_oversized_scb_partition_does_not_block_smaller_partitions(db, database_url, monkeypatch):
    from worker.scb import company_importer as module

    class Client:
        def _post_Je_HamtaForetag(self, **kwargs):
            return [{'PeOrgNr': '199001010011', 'Företagsnamn': 'Test'}]

    monkeypatch.setattr(module, 'get_db_connection', lambda: psycopg.connect(database_url, row_factory=dict_row))
    importer = module.SCBCompanyImporter(Client())
    monkeypatch.setattr(importer, '_get_company_partitions', lambda **kwargs: (
        [{'cats': [], 'num_co': 1}], [], [], [{'cats': [], 'num_co': 2001}], 2002,
    ))
    importer.seed_all_companies()
    assert scalar(db, 'SELECT status FROM meta.ingestion_run') == 'partial'
    assert scalar(db, 'SELECT count(*) FROM core.company') == 1


def test_scb_partial_run_continues_without_database_fixture(monkeypatch):
    from worker.scb import company_importer as module

    finished_statuses = []
    executed_queries = []

    class Connection:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def execute(self, query, params):
            executed_queries.append((query, params))

        def commit(self):
            pass

    class Client:
        def _post_Je_HamtaForetag(self, **kwargs):
            return [{'PeOrgNr': '199001010011', 'Företagsnamn': 'Test'}]

    monkeypatch.setattr(module, 'get_db_connection', Connection)
    monkeypatch.setattr(module, 'start_run', lambda *args, **kwargs: 7)
    monkeypatch.setattr(module, 'finish_run', lambda *args, **kwargs: finished_statuses.append(kwargs['status']))
    monkeypatch.setattr(module, 'archive_api_payloads', lambda *args: None)
    monkeypatch.setattr(module, 'load_batch', lambda *args: {
        'records_seen': 1, 'records_new': 1, 'records_changed': 0,
    })
    monkeypatch.setattr(module, 'checkpoint', lambda *args: None)
    monkeypatch.setattr(module, 'invalidate_overview_caches', lambda *args: None)
    monkeypatch.setattr(module, 'prewarm_overview_caches', lambda *args: None)
    importer = module.SCBCompanyImporter(Client())
    monkeypatch.setattr(importer, '_get_company_partitions', lambda **kwargs: (
        [{'cats': [], 'num_co': 1}], [], [], [{'cats': [], 'num_co': 2001}], 2002,
    ))

    importer.seed_all_companies()

    assert finished_statuses == ['partial']
    assert executed_queries[0][1][0].obj['partition_coverage'] == {
        'expected': 2002, 'covered': 1, 'insufficient_partitions': 1,
    }


def test_scb_keyboard_interrupt_marks_run_interrupted(monkeypatch):
    from worker.scb import company_importer as module

    finished = []

    class Connection:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def commit(self):
            pass

    def interrupt(**kwargs):
        raise KeyboardInterrupt

    monkeypatch.setattr(module, 'get_db_connection', Connection)
    monkeypatch.setattr(module, 'start_run', lambda *args, **kwargs: 7)
    monkeypatch.setattr(module, 'finish_run', lambda *args, **kwargs: finished.append(kwargs))
    importer = module.SCBCompanyImporter(object())
    monkeypatch.setattr(importer, '_get_company_partitions', interrupt)

    with pytest.raises(KeyboardInterrupt):
        importer.seed_all_companies()

    assert finished == [{'status': 'interrupted', 'error': 'KeyboardInterrupt'}]
