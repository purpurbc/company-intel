from __future__ import annotations

from psycopg.types.json import Jsonb


def start_run(
    conn,
    source: str,
    *,
    dataset: str = "company",
    filename=None,
    checksum=None,
    metadata=None,
    source_as_of_date=None,
):
    return conn.execute('''
        INSERT INTO meta.ingestion_run(
            source, dataset, filename, file_checksum, metadata, source_as_of_date
        )
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
    ''', (
        source,
        dataset,
        filename,
        checksum,
        Jsonb(metadata or {}),
        source_as_of_date,
    )).fetchone()['id']


def checkpoint(conn, run_id, row_number, result, *, skipped=0):
    conn.execute('''
        UPDATE meta.ingestion_run SET last_row_number = %s,
            records_seen = records_seen + %s, records_new = records_new + %s,
            records_changed = records_changed + %s, records_skipped = records_skipped + %s
        WHERE id = %s
    ''', (row_number, result['records_seen'], result['records_new'], result['records_changed'], skipped, run_id))


def finish_run(conn, run_id, *, status='done', error=None):
    conn.execute('UPDATE meta.ingestion_run SET status = %s, error = %s, finished_at = clock_timestamp() WHERE id = %s',
                 (status, error, run_id))


def resume_or_start(
    conn,
    source,
    *,
    dataset: str = "company",
    filename,
    checksum,
    metadata,
    resume,
    source_as_of_date=None,
):
    if resume:
        row = conn.execute('''
            SELECT id, last_row_number, status FROM meta.ingestion_run
            WHERE source = %s AND dataset = %s AND file_checksum = %s
              AND metadata @> %s AND schema_version = '2'
            ORDER BY id DESC LIMIT 1 FOR UPDATE
        ''', (source, dataset, checksum, Jsonb(metadata))).fetchone()
        if row:
            if row['status'] != 'done':
                conn.execute("UPDATE meta.ingestion_run SET status = 'running', error = NULL, finished_at = NULL WHERE id = %s", (row['id'],))
            return row['id'], row['last_row_number'], row['status'] == 'done'
    return start_run(
        conn,
        source,
        dataset=dataset,
        filename=filename,
        checksum=checksum,
        metadata=metadata,
        source_as_of_date=source_as_of_date,
    ), 0, False
