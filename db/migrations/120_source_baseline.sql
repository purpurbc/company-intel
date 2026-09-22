-- Baseline 3/5: normalized, versioned source observations and source relations.
-- Source records are normalized JSONB so new source fields do not require a DDL change.
-- Identifiers, intervals and relations are constrained; core stores typed query columns.
CREATE TABLE src_scb.company_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source text NOT NULL REFERENCES meta.source(code),
    source_key text NOT NULL,
    source_subkey text NOT NULL DEFAULT '',
    company_id bigint NOT NULL REFERENCES core.company(company_id),
    data jsonb NOT NULL,
    row_hash text NOT NULL,
    valid_from timestamptz NOT NULL,
    valid_to timestamptz,
    first_ingestion_run_id bigint NOT NULL REFERENCES meta.ingestion_run(id),
    last_ingestion_run_id bigint NOT NULL REFERENCES meta.ingestion_run(id),
    first_row_number bigint NOT NULL,
    last_row_number bigint NOT NULL,
    CHECK (valid_to IS NULL OR valid_to > valid_from),
    CHECK (jsonb_typeof(data) = 'object'),
    FOREIGN KEY (source, first_ingestion_run_id, first_row_number)
        REFERENCES raw.company_record(source, ingestion_run_id, row_number),
    FOREIGN KEY (source, last_ingestion_run_id, last_row_number)
        REFERENCES raw.company_record(source, ingestion_run_id, row_number)
);
ALTER TABLE src_scb.company_history ADD CHECK (source IN ('scb_api', 'scb_bulk', 'legacy'));
CREATE UNIQUE INDEX scb_company_current ON src_scb.company_history(source, source_key, source_subkey) WHERE valid_to IS NULL;
CREATE INDEX scb_company_versions ON src_scb.company_history(company_id, source, valid_from DESC);
CREATE VIEW src_scb.api_company_history AS SELECT * FROM src_scb.company_history WHERE source = 'scb_api';
CREATE VIEW src_scb.bulk_company_history AS SELECT * FROM src_scb.company_history WHERE source = 'scb_bulk';
CREATE VIEW src_scb.api_company_current AS SELECT * FROM src_scb.api_company_history WHERE valid_to IS NULL;
CREATE VIEW src_scb.bulk_company_current AS SELECT * FROM src_scb.bulk_company_history WHERE valid_to IS NULL;

CREATE TABLE src_bolagsverket.organization_history (
    LIKE src_scb.company_history INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING STORAGE
);
ALTER TABLE src_bolagsverket.organization_history
    ADD PRIMARY KEY (id),
    ADD CHECK (source = 'bolagsverket'),
    ADD CHECK (valid_to IS NULL OR valid_to > valid_from),
    ADD FOREIGN KEY (company_id) REFERENCES core.company(company_id),
    ADD FOREIGN KEY (first_ingestion_run_id) REFERENCES meta.ingestion_run(id),
    ADD FOREIGN KEY (last_ingestion_run_id) REFERENCES meta.ingestion_run(id),
    ADD FOREIGN KEY (source, first_ingestion_run_id, first_row_number)
        REFERENCES raw.company_record(source, ingestion_run_id, row_number),
    ADD FOREIGN KEY (source, last_ingestion_run_id, last_row_number)
        REFERENCES raw.company_record(source, ingestion_run_id, row_number);
CREATE UNIQUE INDEX organization_current_key ON src_bolagsverket.organization_history(source_key, source_subkey) WHERE valid_to IS NULL;
CREATE INDEX organization_versions ON src_bolagsverket.organization_history(company_id, valid_from DESC);
CREATE VIEW src_bolagsverket.organization_current AS SELECT * FROM src_bolagsverket.organization_history WHERE valid_to IS NULL;

CREATE TABLE src_bolagsverket.organization_name (
    organization_history_id bigint NOT NULL REFERENCES src_bolagsverket.organization_history(id),
    ordinal smallint NOT NULL,
    name text NOT NULL,
    name_type_code text,
    registered_on date,
    business_description text,
    PRIMARY KEY (organization_history_id, ordinal)
);
CREATE INDEX organization_name_search ON src_bolagsverket.organization_name USING gin(name gin_trgm_ops);
CREATE INDEX organization_name_prefix ON src_bolagsverket.organization_name(lower(name) text_pattern_ops);
CREATE INDEX organization_name_tokens ON src_bolagsverket.organization_name USING gin (to_tsvector('simple', coalesce(name, '')));
CREATE TABLE src_bolagsverket.organization_procedure (
    organization_history_id bigint NOT NULL REFERENCES src_bolagsverket.organization_history(id),
    ordinal smallint NOT NULL,
    procedure_code text,
    procedure_text text,
    started_on date,
    PRIMARY KEY (organization_history_id, ordinal)
);
CREATE VIEW src_bolagsverket.organization_name_history AS
SELECT h.company_id, h.source_key, h.source_subkey, n.*, h.valid_from, h.valid_to
FROM src_bolagsverket.organization_name n JOIN src_bolagsverket.organization_history h ON h.id = n.organization_history_id;
CREATE VIEW src_bolagsverket.organization_procedure_history AS
SELECT h.company_id, h.source_key, h.source_subkey, p.*, h.valid_from, h.valid_to
FROM src_bolagsverket.organization_procedure p JOIN src_bolagsverket.organization_history h ON h.id = p.organization_history_id;
CREATE VIEW core.company_name_history AS
SELECT company_id, name, name_type_code, source_subkey, registered_on, valid_from, valid_to, 'bolagsverket'::text AS source
FROM src_bolagsverket.organization_name_history
UNION ALL
SELECT company_id, company_name, 'entity_name', '', NULL::date, valid_from, valid_to,
       provenance->'company_name'->>'source'
FROM core.company_state_history WHERE company_name IS NOT NULL
UNION ALL
SELECT company_id, registered_name, 'registered_name', '', NULL::date, valid_from, valid_to,
       provenance->'registered_name'->>'source'
FROM core.company_state_history WHERE registered_name IS NOT NULL;
