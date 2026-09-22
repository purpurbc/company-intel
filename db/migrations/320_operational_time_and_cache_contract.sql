-- Operational timestamps have distinct meanings:
-- source_as_of_date: the source publisher's reference date, when known.
-- started_at/finished_at: when Cintela imported the source.
-- observed_at/valid_from: one stable observation instant per ingestion run.
-- effective_at: when a source-reported business event actually took effect.
COMMENT ON COLUMN meta.ingestion_run.source_as_of_date IS
    'Publisher reference date; never inferred from the Cintela import time.';
COMMENT ON COLUMN meta.ingestion_run.started_at IS
    'Start of the Cintela import; also the stable observed_at for that run.';
COMMENT ON COLUMN meta.ingestion_run.finished_at IS
    'Time when the Cintela import finished, independent of source dates.';
COMMENT ON COLUMN raw.company_record.observed_at IS
    'Stable import observation time copied from meta.ingestion_run.started_at.';
COMMENT ON COLUMN core.company_event.effective_at IS
    'Source-reported business date; NULL when only discovery time is known.';

ALTER TABLE app.overview_cache
    RENAME COLUMN refreshed_at TO generated_at;

ALTER TABLE app.overview_cache
    ADD COLUMN expires_at timestamptz;

UPDATE app.overview_cache
SET expires_at = generated_at + interval '1 hour'
WHERE expires_at IS NULL;

ALTER TABLE app.overview_cache
    ALTER COLUMN expires_at SET NOT NULL,
    ALTER COLUMN expires_at SET DEFAULT (current_timestamp + interval '1 hour');

CREATE INDEX overview_cache_expires_at
ON app.overview_cache(expires_at);

COMMENT ON TABLE app.overview_cache IS
    'Disposable overview responses with explicit generation and expiry times.';
COMMENT ON COLUMN app.overview_cache.generated_at IS
    'Time when the cached response was calculated.';
COMMENT ON COLUMN app.overview_cache.expires_at IS
    'Hard expiry; stale responses are never served.';
