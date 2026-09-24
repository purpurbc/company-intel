"""Apply the current database baseline and later incremental migrations."""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from db.reference_codes import seed_geography


MIGRATIONS = Path(__file__).parent / 'migrations'

CURRENT_BASELINE_MIGRATION = '100_current_baseline.sql'
PREVIOUS_TERMINAL_MIGRATION = '380_statistics_summary_marts.sql'


def _migration_files():
    return sorted(MIGRATIONS.glob('*.sql'))


def _previous_chain_is_complete(applied):
    if not applied or CURRENT_BASELINE_MIGRATION in applied:
        return False
    if PREVIOUS_TERMINAL_MIGRATION in applied:
        return True
    raise RuntimeError(
        'Database has a partially applied pre-squash migration chain. '
        'Finish it with the previous code revision or rebuild a disposable '
        'database before using the current baseline.'
    )


def migrate(conn, *, check=False):
    with conn.transaction():
        conn.execute('SELECT pg_advisory_xact_lock(704192602)')
        if not check:
            conn.execute('CREATE SCHEMA IF NOT EXISTS meta')
            conn.execute('''CREATE TABLE IF NOT EXISTS meta.schema_migration (
                filename text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
            )''')
        ledger_exists = conn.execute("SELECT to_regclass('meta.schema_migration')").fetchone()[0] is not None
        applied = dict(conn.execute('SELECT filename, checksum FROM meta.schema_migration').fetchall()) if ledger_exists else {}
        migration_files = _migration_files()
        adopt_baseline = _previous_chain_is_complete(applied)
        for path in migration_files:
            contents = path.read_text(encoding='utf-8')
            checksum = hashlib.sha256(contents.encode()).hexdigest()
            if path.name in applied:
                if applied[path.name] != checksum:
                    raise RuntimeError(f'Applied migration was edited: {path.name}. Add a new migration instead.')
                continue
            if adopt_baseline and path.name == CURRENT_BASELINE_MIGRATION:
                print(f'{"Adoptable" if check else "Adopting"}: {path.name}', flush=True)
                if not check:
                    conn.execute(
                        'INSERT INTO meta.schema_migration(filename, checksum) VALUES (%s, %s)',
                        (path.name, checksum),
                    )
                continue
            print(f'{"Pending" if check else "Applying"}: {path.name}', flush=True)
            if not check:
                conn.execute(contents, prepare=False)
                conn.execute('INSERT INTO meta.schema_migration(filename, checksum) VALUES (%s, %s)', (path.name, checksum))
        if not check:
            seed_geography(conn)
    return not check


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='List pending migrations without applying them')
    args = parser.parse_args()
    url = os.environ.get('DATABASE_URL')
    if not url:
        raise SystemExit('Set DATABASE_URL before migrating')
    with psycopg.connect(url, autocommit=True) as conn:
        migrate(conn, check=args.check)
    print('Schema checked.' if args.check else 'Schema ready.')


if __name__ == '__main__':
    main()
