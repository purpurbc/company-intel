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

# The original v2 chain was squashed after 188. A database that completed that
# chain already has the same schema as the five baseline files and can adopt
# their checksums without replaying CREATE statements. A partially upgraded
# legacy database must not silently skip the removed repair migrations.
LEGACY_TERMINAL_MIGRATION = '188_company_name_search.sql'
SQUASHED_BASELINE_MIGRATIONS = frozenset({
    '100_platform_baseline.sql',
    '110_company_baseline.sql',
    '120_source_baseline.sql',
    '130_product_baseline.sql',
    '140_read_models_baseline.sql',
})
LEGACY_MIGRATIONS = frozenset({
    '100_metadata.sql',
    '110_company.sql',
    '120_source_history.sql',
    '130_application.sql',
    '140_read_models.sql',
    '150_cleanup_v1_artifacts.sql',
    '150_legacy_transfer.sql',
    '170_simplify_app_company_contract.sql',
    '180_fast_company_reads.sql',
    '181_overview_cache.sql',
    '182_restore_current_fields_from_history.sql',
    '183_rehash_repaired_current_states.sql',
    '184_regional_overview_cache_and_search_indexes.sql',
    '185_move_bolagsverket_business_description.sql',
    '186_restore_registration_description_and_add_organization_form.sql',
    '187_expose_legacy_registration_description.sql',
    LEGACY_TERMINAL_MIGRATION,
})

# The first post-baseline work was developed as ten small migrations. Keep the
# applied filenames recognizable for existing databases, while new databases
# execute the same final DDL from one responsibility-based file.
CONSOLIDATED_OPTIMIZATION_MIGRATION = '200_product_and_query_optimizations.sql'
FORMER_OPTIMIZATION_MIGRATIONS = frozenset({
    '200_company_metric_sort_indexes.sql',
    '210_company_metric_name_desc_indexes.sql',
    '220_search_observability.sql',
    '230_company_registration_date_index.sql',
    '240_company_watch_and_search_scope_cleanup.sql',
    '250_company_combined_name_search.sql',
    '260_organization_current_name_lookup.sql',
    '270_company_filter_planner_support.sql',
    '280_company_current_search_scope_lookup.sql',
    '290_regional_overview_indexes.sql',
})


def _migration_files():
    return sorted(MIGRATIONS.glob('*.sql'))


def _legacy_baseline_is_complete(applied):
    legacy_applied = LEGACY_MIGRATIONS.intersection(applied)
    if not legacy_applied:
        return False
    if LEGACY_TERMINAL_MIGRATION not in applied:
        raise RuntimeError(
            'Database has a partially applied pre-squash migration chain. '
            'Finish it with the old migration files or rebuild the database '
            'before using the squashed baseline.'
        )
    return True


def _former_optimizations_are_complete(applied):
    found = FORMER_OPTIMIZATION_MIGRATIONS.intersection(applied)
    if not found:
        return False
    if found != FORMER_OPTIMIZATION_MIGRATIONS:
        missing = sorted(FORMER_OPTIMIZATION_MIGRATIONS - found)
        raise RuntimeError(
            'Database has a partially applied pre-consolidation optimization '
            f'chain. Missing: {", ".join(missing)}'
        )
    return True


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
        adopt_baseline = _legacy_baseline_is_complete(applied)
        adopt_optimizations = _former_optimizations_are_complete(applied)
        for path in migration_files:
            contents = path.read_text(encoding='utf-8')
            checksum = hashlib.sha256(contents.encode()).hexdigest()
            if path.name in applied:
                if applied[path.name] != checksum:
                    raise RuntimeError(f'Applied migration was edited: {path.name}. Add a new migration instead.')
                continue
            if adopt_baseline and path.name in SQUASHED_BASELINE_MIGRATIONS:
                print(f'{"Adoptable" if check else "Adopting"}: {path.name}', flush=True)
                if not check:
                    conn.execute(
                        'INSERT INTO meta.schema_migration(filename, checksum) VALUES (%s, %s)',
                        (path.name, checksum),
                    )
                continue
            if (
                adopt_optimizations
                and path.name == CONSOLIDATED_OPTIMIZATION_MIGRATION
            ):
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
