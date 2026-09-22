from worker.ingest.adapters import digest, json_text


def archive_api_payloads(conn, run_id, payloads, start_row):
    """Durable receipt before validation, including failed/incomplete API responses."""
    run = conn.execute(
        "SELECT started_at FROM meta.ingestion_run WHERE id = %s",
        (run_id,),
    ).fetchone()
    if not run:
        raise ValueError("Import run is missing")

    with conn.cursor() as cur:
        with cur.copy('''COPY raw.scb_api_company
            (source, ingestion_run_id, row_number, source_file, payload, raw_hash, observed_at) FROM STDIN''') as copy:
            for index, payload in enumerate(payloads, start=start_row):
                copy.write_row((
                    'scb_api', run_id, index, 'SCB API', json_text(payload),
                    digest(payload), run['started_at'],
                ))
