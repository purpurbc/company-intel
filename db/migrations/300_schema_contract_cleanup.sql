-- Make schema ownership explicit and keep one canonical read path per concept.

-- Extensions are infrastructure, not application objects. Moving relocatable
-- extensions out of public lets us remove the otherwise implicit catch-all
-- schema and forces new SQL to state which application layer it reads.
CREATE SCHEMA extensions;
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

-- Empty procedure elements were emitted by early bulk parsing. They carry no
-- event or audit meaning; the immutable raw record remains available.
DELETE FROM src_bolagsverket.organization_procedure
WHERE procedure_code IS NULL
  AND procedure_text IS NULL
  AND started_on IS NULL;

ALTER TABLE src_bolagsverket.organization_name
    ADD CONSTRAINT organization_name_positive_ordinal CHECK (ordinal > 0),
    ADD CONSTRAINT organization_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE src_bolagsverket.organization_procedure
    ADD CONSTRAINT organization_procedure_positive_ordinal CHECK (ordinal > 0),
    ADD CONSTRAINT organization_procedure_has_content CHECK (
        procedure_code IS NOT NULL
        OR procedure_text IS NOT NULL
        OR started_on IS NOT NULL
    );

-- Names and procedures are normalized 1:N data. Build the API read contract
-- from those tables instead of the duplicate arrays inside the JSON payload.
CREATE OR REPLACE VIEW app.company_registration AS
SELECT
    h.company_id,
    h.id AS registration_version_id,
    h.source_key,
    h.source_subkey,
    CASE
        WHEN h.data->'_registration' ? 'business_description'
            OR h.data->>'business_description' IS NULL
        THEN h.data->'_registration'
        ELSE h.data->'_registration' || jsonb_build_object(
            'business_description', h.data->>'business_description'
        )
    END AS registration,
    COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'ordinal', n.ordinal,
                'name', n.name,
                'name_type_code', n.name_type_code,
                'registered_on', n.registered_on,
                'business_description', n.business_description
            ) ORDER BY n.ordinal
        )
        FROM src_bolagsverket.organization_name n
        WHERE n.organization_history_id = h.id
    ), '[]'::jsonb) AS names,
    COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'ordinal', p.ordinal,
                'procedure_code', p.procedure_code,
                'procedure_text', p.procedure_text,
                'started_on', p.started_on
            ) ORDER BY p.ordinal
        )
        FROM src_bolagsverket.organization_procedure p
        WHERE p.organization_history_id = h.id
    ), '[]'::jsonb) AS procedures,
    h.valid_from,
    h.last_ingestion_run_id
FROM src_bolagsverket.organization_current h;

-- Use the same noun at the core and application layers.
ALTER VIEW app.business_event RENAME TO company_event;

-- These pass-through views had no callers and duplicated already explicit
-- source/core contracts.
DROP VIEW app.company_history;
DROP VIEW app.ingestion_run;
DROP VIEW app.company_source_details;
DROP VIEW app.workplace;

UPDATE meta.source
SET name = 'Migrerad historik'
WHERE code = 'legacy';

DROP SCHEMA public;
