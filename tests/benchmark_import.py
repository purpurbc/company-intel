"""Exercise local bulk files in a fresh disposable database. Never uses DATABASE_URL."""
import argparse
import os
import time
from itertools import islice
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from psycopg.rows import dict_row

from db.migrate import migrate
from worker.bulk_files.parser import iter_delimited_rows, parse_bolagsverket_bulk_row, parse_scb_bulk_row
from worker.ingest.adapters import bolagsverket_record, scb_bulk_record
from worker.ingest.repository import load_batch
from worker.ingest.runs import finish_run, start_run


class TimingCursor(psycopg.ClientCursor):
    def execute(self, query, params=None, **kwargs):
        tick = time.monotonic()
        result = super().execute(query, params, **kwargs)
        elapsed = time.monotonic() - tick
        if elapsed > 0.5:
            print(f'  SQL {str(query).strip()[:75]}... {elapsed:.2f}s', flush=True)
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--records', type=int, default=20000)
    args = parser.parse_args()
    from worker.ingest import repository
    repository.ClientCursor = TimingCursor
    base = os.environ['TEST_DATABASE_URL']
    name = 'company_intel_benchmark_' + uuid4().hex
    url = make_conninfo(**(conninfo_to_dict(base) | {'dbname': name}))
    with psycopg.connect(base, autocommit=True) as admin:
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(name)))
    try:
        with psycopg.connect(url, autocommit=True) as conn:
            migrate(conn)
        with psycopg.connect(url, row_factory=dict_row) as conn:
            for source, path, delimiter, parse, adapt in (
                ('scb_bulk', 'data/scb_bulkfil.zip', '\t', parse_scb_bulk_row, scb_bulk_record),
                ('bolagsverket', 'data/bolagsverket_bulkfil.zip', ';', parse_bolagsverket_bulk_row, bolagsverket_record),
            ):
                tick = time.monotonic()
                records = [adapt(parse(row)) for row in islice(iter_delimited_rows(path, delimiter), args.records)]
                print(f'{source}: parsed {len(records)} records in {time.monotonic() - tick:.2f}s', flush=True)
                for mode in ('first import', 'unchanged reimport'):
                    run_id = start_run(conn, source)
                    tick = time.monotonic()
                    result = load_batch(conn, source, run_id, records)
                    finish_run(conn, run_id)
                    conn.commit()
                    print(f'{source} {mode}: {result}, {time.monotonic() - tick:.2f}s', flush=True)
    finally:
        with psycopg.connect(base, autocommit=True) as admin:
            admin.execute(sql.SQL('DROP DATABASE {} WITH (FORCE)').format(sql.Identifier(name)))


if __name__ == '__main__':
    main()
