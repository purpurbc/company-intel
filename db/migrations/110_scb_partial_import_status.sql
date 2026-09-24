ALTER TABLE meta.ingestion_run
    DROP CONSTRAINT ingestion_run_status_check;

ALTER TABLE meta.ingestion_run
    ADD CONSTRAINT ingestion_run_status_check
    CHECK (status IN ('running', 'done', 'partial', 'failed', 'interrupted'));
