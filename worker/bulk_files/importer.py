from __future__ import annotations

import hashlib
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path
from urllib.request import urlopen

from worker.bulk_files.parser import (
    bolagsverket_identity_type_code, is_url, iter_delimited_rows,
    parse_bolagsverket_bulk_row, parse_scb_bulk_row,
)
from worker.ingest.adapters import bolagsverket_record, scb_bulk_record
from worker.ingest.repository import load_batch
from worker.ingest.overview_cache import (
    invalidate_overview_caches,
    prewarm_overview_caches,
)
from worker.ingest.runs import checkpoint, finish_run, resume_or_start


DEFAULT_BOLAGSVERKET_IDENTITY_TYPES = {'ORGNR-IDORG', 'PERSON-IDORG'}


@contextmanager
def local_source(source):
    if not is_url(source):
        yield Path(source)
        return
    # Seekable zip file on disk; never hold a national bulk file in RAM.
    with tempfile.TemporaryDirectory(prefix='company-intel-') as directory:
        path = Path(directory) / str(source).rstrip('/').rsplit('/', 1)[-1]
        size = 0
        last_print = 0
        print(f'Downloading {path.name}...', flush=True)
        with urlopen(str(source), timeout=120) as response, path.open('wb') as output:
            while block := response.read(1024 * 1024):
                output.write(block)
                size += len(block)
                if time.monotonic() - last_print > 5:
                    print(f'Downloaded {size / 1024 / 1024:.0f} MiB', flush=True)
                    last_print = time.monotonic()
        yield path


def file_checksum(path):
    print(f'Checking file fingerprint: {path.name}', flush=True)
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


class BulkCompanyFileImporter:
    def __init__(self, batch_size=20000, progress_every=1000, *, sni_version='2025', source_as_of_date=None):
        if batch_size < 1 or progress_every < 1:
            raise ValueError('batch_size and progress_every must be positive')
        self.batch_size = batch_size
        self.progress_every = progress_every
        self.sni_version = sni_version
        self.source_as_of_date = source_as_of_date

    def import_scb_bulk_file(self, path, resume=False):
        return self._import(path, 'scb_bulk', resume=resume)

    def import_bolagsverket_bulk_file(self, path, resume=False, include_non_orgnr=False, identity_types=None):
        allowed = identity_types
        if allowed is None and not include_non_orgnr:
            allowed = DEFAULT_BOLAGSVERKET_IDENTITY_TYPES
        return self._import(path, 'bolagsverket', resume=resume, identity_types=allowed)

    def _import(self, path, source, *, resume, identity_types=None):
        from worker.database import get_db_connection

        run_id = None
        started = time.monotonic()
        totals = dict(records_seen=0, records_new=0, records_changed=0, records_parsed=0, records_skipped=0)
        with local_source(path) as local_path, get_db_connection() as conn:
            checksum = file_checksum(local_path)
            metadata = {
                'adapter_version': 1,
                'identity_types': sorted(identity_types) if identity_types is not None else None,
                'sni_version': self.sni_version if source == 'scb_bulk' else None,
                'source_as_of_date': str(self.source_as_of_date) if self.source_as_of_date else None,
            }
            lock_key = f'{source}:{checksum}:{metadata}'
            locked = conn.execute('SELECT pg_try_advisory_lock(hashtextextended(%s, 0)) AS locked', (lock_key,)).fetchone()['locked']
            if not locked:
                raise RuntimeError('This exact file/filter import is already running')
            try:
                run_id, skipped_through, done = resume_or_start(
                    conn, source, filename=local_path.name, checksum=checksum, metadata=metadata,
                    resume=resume, source_as_of_date=self.source_as_of_date,
                )
                conn.commit()
                if done:
                    print(f'Run {run_id}: this exact file and filter are already complete.', flush=True)
                    return totals
                print(f'Run {run_id}: {source}, resume after record {skipped_through}, batch={self.batch_size}', flush=True)
                batch = []
                pending_skipped = 0
                last_row = skipped_through
                for row in iter_delimited_rows(
                    local_path, delimiter='\t' if source == 'scb_bulk' else ';',
                    skip_source_rows_through=skipped_through,
                    progress_every=self.progress_every,
                    required_headers=({'PeOrgNr', 'Namn'} if source == 'scb_bulk'
                                      else {'organisationsidentitet', 'namnskyddslopnummer', 'organisationsnamn'}),
                ):
                    last_row = row.source_row_number
                    totals['records_parsed'] += 1
                    if source == 'bolagsverket' and identity_types is not None and bolagsverket_identity_type_code(row.payload) not in identity_types:
                        pending_skipped += 1
                        totals['records_skipped'] += 1
                    else:
                        try:
                            record = (scb_bulk_record(parse_scb_bulk_row(row), sni_version=self.sni_version)
                                      if source == 'scb_bulk' else bolagsverket_record(parse_bolagsverket_bulk_row(row)))
                        except Exception as exc:
                            raise ValueError(f'Invalid {source} record {last_row} in {local_path.name}: {exc}') from exc
                        batch.append(record)
                    if totals['records_parsed'] % self.progress_every == 0:
                        elapsed = max(time.monotonic() - started, 0.001)
                        print(f'{source}: record={last_row:,}, parsed={totals["records_parsed"]:,}, '
                              f'committed={totals["records_seen"]:,}, skipped={totals["records_skipped"]:,}, '
                              f'elapsed={elapsed:.0f}s', flush=True)
                    if len(batch) >= self.batch_size or pending_skipped >= self.batch_size:
                        self._commit(conn, source, run_id, batch, last_row, pending_skipped, totals)
                        batch, pending_skipped = [], 0
                if batch or pending_skipped:
                    self._commit(conn, source, run_id, batch, last_row, pending_skipped, totals)
                finish_run(conn, run_id)
                invalidate_overview_caches(conn)
                conn.commit()
                prewarm_overview_caches(get_db_connection)
            except BaseException as exc:
                conn.rollback()
                if run_id is not None:
                    finish_run(conn, run_id, status='interrupted' if isinstance(exc, KeyboardInterrupt) else 'failed', error=str(exc)[:2000])
                    conn.commit()
                raise
            finally:
                conn.execute('SELECT pg_advisory_unlock(hashtextextended(%s, 0))', (lock_key,))
                conn.commit()
        return totals

    @staticmethod
    def _commit(conn, source, run_id, batch, last_row, skipped, totals):
        tick = time.monotonic()
        print(f'{source}: writing {len(batch):,} records through {last_row:,}...', flush=True)
        result = load_batch(conn, source, run_id, batch)
        checkpoint(conn, run_id, last_row, result, skipped=skipped)
        conn.commit()
        for key, value in result.items():
            totals[key] += value
        print(f'{source}: committed through {last_row:,} in {time.monotonic() - tick:.1f}s '
              f'(new={result["records_new"]:,}, changed={result["records_changed"]:,})', flush=True)
