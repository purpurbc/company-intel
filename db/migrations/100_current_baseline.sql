-- Current schema baseline, generated from the fully applied migration chain.
-- Existing databases at migration 380 adopt its checksum without running this DDL.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA app;

CREATE SCHEMA core;

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE SCHEMA mart;

CREATE SCHEMA IF NOT EXISTS meta;

CREATE SCHEMA raw;

CREATE SCHEMA src_bolagsverket;

CREATE SCHEMA src_scb;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER EXTENSION pgcrypto SET SCHEMA extensions;

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';

CREATE FUNCTION raw.reject_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Raw records are immutable; import a new observation instead';
END;
$$;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE app.app_user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auth_provider text,
    auth_subject text,
    email text,
    display_name text,
    role text DEFAULT 'user'::text NOT NULL,
    company_id bigint,
    company_description text,
    ideal_customer_description text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE src_bolagsverket.statistics_history (
    id bigint NOT NULL,
    dataset text NOT NULL,
    natural_key jsonb NOT NULL,
    natural_key_hash text NOT NULL,
    data jsonb NOT NULL,
    row_hash text NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    first_ingestion_run_id bigint NOT NULL,
    last_ingestion_run_id bigint NOT NULL,
    first_row_number bigint NOT NULL,
    last_row_number bigint NOT NULL,
    CONSTRAINT statistics_history_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from))),
    CONSTRAINT statistics_history_data_check CHECK ((jsonb_typeof(data) = 'object'::text)),
    CONSTRAINT statistics_history_natural_key_check CHECK ((jsonb_typeof(natural_key) = 'object'::text)),
    CONSTRAINT statistics_history_natural_key_hash_check CHECK ((natural_key_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_history_row_hash_check CHECK ((row_hash ~ '^[0-9a-f]{64}$'::text))
);

CREATE VIEW src_bolagsverket.statistics_current AS
 SELECT id,
    dataset,
    natural_key,
    natural_key_hash,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_bolagsverket.statistics_history
  WHERE (valid_to IS NULL);

CREATE VIEW app.bolagsverket_auditor_reservation_statistics AS
 SELECT history.id AS statistics_version_id,
    fact.registration_year,
    fact.formation_type_code,
    fact.company_count,
    fact.with_auditor_at_formation_count,
    fact.with_auditor_reservation_count,
    fact.without_auditor_with_reservation_count,
    fact.with_auditor_reservation_share,
    fact.without_auditor_with_reservation_share,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
   FROM (src_bolagsverket.statistics_current history
     CROSS JOIN LATERAL jsonb_to_record(history.data) fact(registration_year smallint, formation_type_code text, company_count bigint, with_auditor_at_formation_count bigint, with_auditor_reservation_count bigint, without_auditor_with_reservation_count bigint, with_auditor_reservation_share numeric, without_auditor_with_reservation_share numeric))
  WHERE (history.dataset = 'auditor_reservations'::text);

CREATE VIEW app.bolagsverket_company_statistics AS
 SELECT history.id AS statistics_version_id,
    fact.period_start,
    fact.event_code,
    fact.region_family_code,
    fact.region_family_name,
    fact.source_county_code,
    fact.source_municipality_code,
    fact.county_code,
    fact.municipality_code,
    fact.county_name,
    fact.municipality_name,
    fact.source_loaded_at,
    fact.count_ab,
    fact.count_bab,
    fact.count_bf,
    fact.count_brf,
    fact.count_ek,
    fact.count_e,
    fact.count_se,
    fact.count_fl,
    fact.count_fab,
    fact.count_hb,
    fact.count_i,
    fact.count_kb,
    fact.count_khf,
    fact.count_mb,
    fact.count_sf,
    fact.count_sb,
    fact.count_tsf,
    fact.count_bfl,
    fact.count_ofb,
    fact.count_sce,
    fact.count_s,
    fact.count_egts,
    fact.count_fof,
    fact.count_tpab,
    fact.count_otpb,
    fact.count_tpf,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
   FROM (src_bolagsverket.statistics_current history
     CROSS JOIN LATERAL jsonb_to_record(history.data) fact(period_start date, event_code smallint, region_family_code text, region_family_name text, source_county_code text, source_municipality_code text, county_code text, municipality_code text, county_name text, municipality_name text, source_loaded_at timestamp without time zone, count_ab bigint, count_bab bigint, count_bf bigint, count_brf bigint, count_ek bigint, count_e bigint, count_se bigint, count_fl bigint, count_fab bigint, count_hb bigint, count_i bigint, count_kb bigint, count_khf bigint, count_mb bigint, count_sf bigint, count_sb bigint, count_tsf bigint, count_bfl bigint, count_ofb bigint, count_sce bigint, count_s bigint, count_egts bigint, count_fof bigint, count_tpab bigint, count_otpb bigint, count_tpf bigint))
  WHERE (history.dataset = 'companies'::text);

CREATE VIEW app.bolagsverket_filing_delay_statistics AS
 SELECT history.id AS statistics_version_id,
    fact.period_through_year,
    fact.accounting_period_group,
    fact.county_code,
    fact.county_name,
    fact.expected_to_file_count,
    fact.late_fee_count,
    fact.filed_annual_report_count,
    fact.filed_annual_report_share,
    fact.late_fee_share,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
   FROM (src_bolagsverket.statistics_current history
     CROSS JOIN LATERAL jsonb_to_record(history.data) fact(period_through_year smallint, accounting_period_group text, county_code text, county_name text, expected_to_file_count bigint, late_fee_count bigint, filed_annual_report_count bigint, filed_annual_report_share numeric, late_fee_share numeric))
  WHERE (history.dataset = 'filing_delays'::text);

CREATE VIEW app.bolagsverket_representative_statistics AS
 SELECT history.id AS statistics_version_id,
    fact.year,
    fact.organization_form_code,
    fact.county_code,
    fact.municipality_code,
    fact.county_name,
    fact.municipality_name,
    fact.private_public_code,
    fact.is_employee_representative,
    fact.is_foreign_resident,
    fact.is_resident_in_ees,
    fact.gender_code,
    fact.age_band_code,
    fact.representative_entity_type_code,
    fact.has_coordination_number,
    fact.count_ak,
    fact.count_bo,
    fact.count_delg,
    fact.count_eft,
    fact.count_evd,
    fact.count_evvd,
    fact.count_fo,
    fact.count_in,
    fact.count_kd,
    fact.count_kp,
    fact.count_le,
    fact.count_li,
    fact.count_ls,
    fact.count_of,
    fact.count_po,
    fact.count_rep,
    fact.count_rev,
    fact.count_revh,
    fact.count_revl,
    fact.count_revs,
    fact.count_revsl,
    fact.count_revst,
    fact.count_revt,
    fact.count_su,
    fact.count_svd,
    fact.count_vd,
    fact.count_vle,
    fact.count_vof,
    fact.count_vvd,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
   FROM (src_bolagsverket.statistics_current history
     CROSS JOIN LATERAL jsonb_to_record(history.data) fact(year smallint, organization_form_code text, county_code text, municipality_code text, county_name text, municipality_name text, private_public_code text, is_employee_representative boolean, is_foreign_resident boolean, is_resident_in_ees boolean, gender_code text, age_band_code text, representative_entity_type_code text, has_coordination_number boolean, count_ak bigint, count_bo bigint, count_delg bigint, count_eft bigint, count_evd bigint, count_evvd bigint, count_fo bigint, count_in bigint, count_kd bigint, count_kp bigint, count_le bigint, count_li bigint, count_ls bigint, count_of bigint, count_po bigint, count_rep bigint, count_rev bigint, count_revh bigint, count_revl bigint, count_revs bigint, count_revsl bigint, count_revst bigint, count_revt bigint, count_su bigint, count_svd bigint, count_vd bigint, count_vle bigint, count_vof bigint, count_vvd bigint))
  WHERE (history.dataset = 'representatives'::text);

CREATE TABLE core.company (
    company_id bigint NOT NULL,
    entity_type text NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT company_entity_type_check CHECK ((entity_type = ANY (ARRAY['organization'::text, 'person'::text, 'other'::text])))
);

CREATE TABLE core.company_state_history (
    state_id bigint NOT NULL,
    company_id bigint NOT NULL,
    company_name text,
    registered_name text,
    co_address text,
    postal_address text,
    postal_code text,
    postal_city text,
    seat_municipality_code text,
    seat_county_code text,
    region_code text,
    workplace_count integer,
    employee_size_code text,
    activity_status_code text,
    legal_entity_status_code text,
    tax_registry_status_code text,
    legal_form_code text,
    advertising_status_code text,
    bulk_advertising_status_code text,
    mail_status_code text,
    start_date date,
    end_date date,
    scb_registration_date date,
    primary_industry_code text,
    industry_section_code text,
    trade_indicator text,
    turnover_year smallint,
    turnover_class_code text,
    turnover_detail_class_code text,
    ownership_category_code text,
    phone text,
    email text,
    private_public_code text,
    employer_status_code text,
    vat_status_code text,
    f_tax_status_code text,
    company_state_code text,
    registered_name_count integer,
    sector_code text,
    sme_size_code text,
    female_share numeric(5,2),
    male_share numeric(5,2),
    owner_country_code text,
    owner_name text,
    foreign_ownership_code text,
    labels jsonb DEFAULT '{}'::jsonb NOT NULL,
    provenance jsonb DEFAULT '{}'::jsonb NOT NULL,
    state_hash text NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    created_by_run_id bigint NOT NULL,
    organization_form_code text,
    CONSTRAINT company_state_history_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from))),
    CONSTRAINT company_state_history_female_share_check CHECK (((female_share >= (0)::numeric) AND (female_share <= (100)::numeric))),
    CONSTRAINT company_state_history_male_share_check CHECK (((male_share >= (0)::numeric) AND (male_share <= (100)::numeric))),
    CONSTRAINT company_state_history_registered_name_count_check CHECK ((registered_name_count >= 0)),
    CONSTRAINT company_state_history_workplace_count_check CHECK ((workplace_count >= 0))
);
ALTER TABLE ONLY core.company_state_history ALTER COLUMN seat_municipality_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN seat_county_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN activity_status_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN industry_section_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN employer_status_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN vat_status_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN f_tax_status_code SET STATISTICS 500;
ALTER TABLE ONLY core.company_state_history ALTER COLUMN company_state_code SET STATISTICS 500;

CREATE VIEW core.company_current AS
 SELECT state_id,
    company_id,
    company_name,
    registered_name,
    co_address,
    postal_address,
    postal_code,
    postal_city,
    seat_municipality_code,
    seat_county_code,
    region_code,
    workplace_count,
    employee_size_code,
    activity_status_code,
    legal_entity_status_code,
    tax_registry_status_code,
    legal_form_code,
    advertising_status_code,
    bulk_advertising_status_code,
    mail_status_code,
    start_date,
    end_date,
    scb_registration_date,
    primary_industry_code,
    industry_section_code,
    trade_indicator,
    turnover_year,
    turnover_class_code,
    turnover_detail_class_code,
    ownership_category_code,
    phone,
    email,
    private_public_code,
    employer_status_code,
    vat_status_code,
    f_tax_status_code,
    company_state_code,
    registered_name_count,
    sector_code,
    sme_size_code,
    female_share,
    male_share,
    owner_country_code,
    owner_name,
    foreign_ownership_code,
    labels,
    provenance,
    state_hash,
    valid_from,
    valid_to,
    created_by_run_id,
    organization_form_code
   FROM core.company_state_history
  WHERE (valid_to IS NULL);

CREATE TABLE core.company_identifier (
    company_id bigint NOT NULL,
    identity_type text NOT NULL,
    identity_value text NOT NULL,
    CONSTRAINT company_identifier_check CHECK (((identity_type <> 'ORGNR'::text) OR (identity_value ~ '^[0-9]{10}$'::text))),
    CONSTRAINT company_identifier_check1 CHECK (((identity_type <> 'PERSON'::text) OR (identity_value ~ '^[0-9]{12}$'::text))),
    CONSTRAINT company_identifier_check2 CHECK (((identity_type <> 'PERSON_SHORT'::text) OR (identity_value ~ '^[0-9]{10}$'::text)))
);

CREATE VIEW app.company AS
 SELECT s.company_id,
    s.state_id,
    c.entity_type,
    k.identity_type,
        CASE
            WHEN (k.identity_type = 'ORGNR'::text) THEN k.identity_value
            WHEN (k.identity_type = ANY (ARRAY['PERSON'::text, 'PERSON_SHORT'::text])) THEN "right"(k.identity_value, 10)
            ELSE k.identity_value
        END AS org_nr,
        CASE
            WHEN (k.identity_type = 'ORGNR'::text) THEN ('16'::text || k.identity_value)
            WHEN (k.identity_type = 'PERSON'::text) THEN k.identity_value
            ELSE NULL::text
        END AS pe_org_nr,
    s.company_name,
    s.registered_name,
    s.co_address AS care_of_address,
    s.postal_address,
    s.postal_code,
    s.postal_city,
    s.seat_municipality_code AS municipality_code,
    (s.labels ->> 'seat_municipality_code'::text) AS municipality_name,
    s.seat_county_code AS county_code,
    (s.labels ->> 'seat_county_code'::text) AS county_name,
    s.region_code,
    (s.labels ->> 'region_code'::text) AS region_name,
    s.workplace_count,
    s.employee_size_code,
    (s.labels ->> 'employee_size_code'::text) AS employee_size,
    s.activity_status_code,
    (s.labels ->> 'activity_status_code'::text) AS activity_status,
    s.legal_entity_status_code,
    (s.labels ->> 'legal_entity_status_code'::text) AS legal_entity_status,
    s.tax_registry_status_code,
    (s.labels ->> 'tax_registry_status_code'::text) AS tax_registry_status,
    s.legal_form_code,
    (s.labels ->> 'legal_form_code'::text) AS legal_form,
    s.organization_form_code,
    (s.labels ->> 'organization_form_code'::text) AS organization_form,
    s.advertising_status_code,
    (s.labels ->> 'advertising_status_code'::text) AS advertising_status,
    s.bulk_advertising_status_code,
    (s.labels ->> 'bulk_advertising_status_code'::text) AS bulk_advertising_status,
    s.mail_status_code,
    (s.labels ->> 'mail_status_code'::text) AS mail_status,
    s.start_date,
    s.end_date,
    s.scb_registration_date,
    s.primary_industry_code,
    (s.labels ->> 'primary_industry_code'::text) AS primary_industry_name,
    (("left"(s.primary_industry_code, 2) || '.'::text) || SUBSTRING(s.primary_industry_code FROM 3)) AS primary_industry_code_formatted,
    s.industry_section_code,
    (s.labels ->> 'industry_section_code'::text) AS industry_section_name,
    s.trade_indicator,
    s.turnover_year,
    s.turnover_class_code AS turnover_size_code,
    (s.labels ->> 'turnover_class_code'::text) AS turnover_size,
    s.turnover_detail_class_code AS turnover_financial_size_code,
    (s.labels ->> 'turnover_detail_class_code'::text) AS turnover_financial_size,
    s.ownership_category_code,
    (s.labels ->> 'ownership_category_code'::text) AS ownership_category,
    s.phone,
    s.email,
    s.private_public_code,
    (s.labels ->> 'private_public_code'::text) AS private_public,
    s.employer_status_code,
    (s.labels ->> 'employer_status_code'::text) AS employer_status,
    s.vat_status_code,
    (s.labels ->> 'vat_status_code'::text) AS vat_status,
    s.f_tax_status_code,
    (s.labels ->> 'f_tax_status_code'::text) AS f_tax_status,
    s.company_state_code,
    (s.labels ->> 'company_state_code'::text) AS company_state,
    s.registered_name_count,
    s.sector_code,
    (s.labels ->> 'sector_code'::text) AS sector,
    s.sme_size_code,
    (s.labels ->> 'sme_size_code'::text) AS sme_size,
    s.female_share,
    s.male_share,
    s.owner_country_code,
    (s.labels ->> 'owner_country_code'::text) AS owner_country,
    s.owner_name,
    s.foreign_ownership_code,
    (s.labels ->> 'foreign_ownership_code'::text) AS foreign_ownership,
    s.valid_from AS ingested_at,
    NULL::timestamp with time zone AS scb_updated_at,
    s.provenance
   FROM ((core.company_current s
     JOIN core.company c USING (company_id))
     JOIN core.company_identifier k USING (company_id));

CREATE TABLE core.company_change (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    state_id bigint,
    field_name text NOT NULL,
    old_value text,
    new_value text,
    old_label text,
    new_label text,
    detected_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    ingestion_run_id bigint,
    importance smallint DEFAULT 1 NOT NULL
);

CREATE VIEW app.company_change AS
 SELECT h.id,
    h.company_id,
    c.org_nr,
    h.field_name,
    h.old_value,
    h.new_value,
    h.old_label,
    h.new_label,
    h.detected_at,
    h.ingestion_run_id,
    h.importance
   FROM (core.company_change h
     JOIN app.company c USING (company_id));

CREATE TABLE core.company_event (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    event_type text NOT NULL,
    title text NOT NULL,
    description text,
    effective_at date,
    detected_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    ingestion_run_id bigint,
    company_change_ids bigint[],
    importance smallint DEFAULT 1 NOT NULL
);

COMMENT ON COLUMN core.company_event.effective_at IS 'Source-reported business date; NULL when only discovery time is known.';

CREATE VIEW app.company_event AS
 SELECT e.id,
    e.company_id,
    e.event_type,
    e.title,
    e.description,
    e.effective_at,
    e.detected_at,
    e.ingestion_run_id,
    e.company_change_ids,
    e.importance,
    c.org_nr
   FROM (core.company_event e
     JOIN app.company c USING (company_id));

CREATE VIEW app.company_list AS
 SELECT s.company_id,
        CASE
            WHEN (k.identity_type = 'ORGNR'::text) THEN k.identity_value
            WHEN (k.identity_type = ANY (ARRAY['PERSON'::text, 'PERSON_SHORT'::text])) THEN "right"(k.identity_value, 10)
            ELSE k.identity_value
        END AS org_nr,
        CASE
            WHEN (k.identity_type = 'ORGNR'::text) THEN ('16'::text || k.identity_value)
            WHEN (k.identity_type = 'PERSON'::text) THEN k.identity_value
            ELSE NULL::text
        END AS pe_org_nr,
    s.state_id,
    s.company_name,
    s.registered_name,
    s.postal_city,
    s.seat_municipality_code AS municipality_code,
    (s.labels ->> 'seat_municipality_code'::text) AS municipality_name,
    s.seat_county_code AS county_code,
    (s.labels ->> 'seat_county_code'::text) AS county_name,
    s.region_code,
    (s.labels ->> 'region_code'::text) AS region_name,
    s.industry_section_code,
    (s.labels ->> 'industry_section_code'::text) AS industry_section_name,
    s.primary_industry_code,
    (s.labels ->> 'primary_industry_code'::text) AS primary_industry_name,
    s.employee_size_code,
    (s.labels ->> 'employee_size_code'::text) AS employee_size,
    s.turnover_class_code AS turnover_size_code,
    (s.labels ->> 'turnover_class_code'::text) AS turnover_size,
    s.turnover_detail_class_code AS turnover_financial_size_code,
    (s.labels ->> 'turnover_detail_class_code'::text) AS turnover_financial_size,
    s.legal_form_code,
    (s.labels ->> 'legal_form_code'::text) AS legal_form,
    s.organization_form_code,
    (s.labels ->> 'organization_form_code'::text) AS organization_form,
    s.sector_code,
    (s.labels ->> 'sector_code'::text) AS sector,
    s.activity_status_code,
    (s.labels ->> 'activity_status_code'::text) AS activity_status,
    s.company_state_code,
    (s.labels ->> 'company_state_code'::text) AS company_state,
    s.employer_status_code,
    (s.labels ->> 'employer_status_code'::text) AS employer_status,
    s.vat_status_code,
    s.f_tax_status_code,
    s.advertising_status_code,
    s.ownership_category_code,
    s.sme_size_code,
    s.trade_indicator,
    s.postal_code,
    s.start_date,
    s.scb_registration_date,
    s.valid_from AS ingested_at
   FROM (core.company_current s
     JOIN core.company_identifier k USING (company_id));

CREATE TABLE src_bolagsverket.organization_history (
    id bigint NOT NULL,
    source text NOT NULL,
    source_key text NOT NULL,
    source_subkey text DEFAULT ''::text NOT NULL,
    company_id bigint NOT NULL,
    data jsonb NOT NULL,
    row_hash text NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    first_ingestion_run_id bigint NOT NULL,
    last_ingestion_run_id bigint NOT NULL,
    first_row_number bigint NOT NULL,
    last_row_number bigint NOT NULL,
    CONSTRAINT organization_history_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from))),
    CONSTRAINT organization_history_source_check CHECK ((source = 'bolagsverket'::text))
);

CREATE VIEW src_bolagsverket.organization_current AS
 SELECT id,
    source,
    source_key,
    source_subkey,
    company_id,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_bolagsverket.organization_history
  WHERE (valid_to IS NULL);

CREATE TABLE src_bolagsverket.organization_name (
    organization_history_id bigint NOT NULL,
    ordinal smallint NOT NULL,
    name text NOT NULL,
    name_type_code text,
    registered_on date,
    business_description text,
    CONSTRAINT organization_name_not_blank CHECK ((btrim(name) <> ''::text)),
    CONSTRAINT organization_name_positive_ordinal CHECK ((ordinal > 0))
);

CREATE TABLE src_bolagsverket.organization_procedure (
    organization_history_id bigint NOT NULL,
    ordinal smallint NOT NULL,
    procedure_code text,
    procedure_text text,
    started_on date,
    CONSTRAINT organization_procedure_has_content CHECK (((procedure_code IS NOT NULL) OR (procedure_text IS NOT NULL) OR (started_on IS NOT NULL))),
    CONSTRAINT organization_procedure_positive_ordinal CHECK ((ordinal > 0))
);

CREATE VIEW app.company_registration AS
 SELECT company_id,
    id AS registration_version_id,
    source_key,
    source_subkey,
        CASE
            WHEN (((data -> '_registration'::text) ? 'business_description'::text) OR ((data ->> 'business_description'::text) IS NULL)) THEN (data -> '_registration'::text)
            ELSE ((data -> '_registration'::text) || jsonb_build_object('business_description', (data ->> 'business_description'::text)))
        END AS registration,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('ordinal', n.ordinal, 'name', n.name, 'name_type_code', n.name_type_code, 'registered_on', n.registered_on, 'business_description', n.business_description) ORDER BY n.ordinal) AS jsonb_agg
           FROM src_bolagsverket.organization_name n
          WHERE (n.organization_history_id = h.id)), '[]'::jsonb) AS names,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('ordinal', p.ordinal, 'procedure_code', p.procedure_code, 'procedure_text', p.procedure_text, 'started_on', p.started_on) ORDER BY p.ordinal) AS jsonb_agg
           FROM src_bolagsverket.organization_procedure p
          WHERE (p.organization_history_id = h.id)), '[]'::jsonb) AS procedures,
    valid_from,
    last_ingestion_run_id
   FROM src_bolagsverket.organization_current h;

CREATE TABLE meta.code (
    source text NOT NULL,
    domain text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    parent_code text
);

CREATE VIEW app.dim_bolagsverket_formation_type AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'formation_type'::text));

CREATE VIEW app.dim_bolagsverket_region_family AS
 SELECT DISTINCT ON (fact.region_family_code) fact.region_family_code AS code,
    fact.region_family_name AS name
   FROM (src_bolagsverket.statistics_current history
     CROSS JOIN LATERAL jsonb_to_record(history.data) fact(region_family_code text, region_family_name text))
  WHERE ((history.dataset = 'companies'::text) AND (fact.region_family_code IS NOT NULL))
  ORDER BY fact.region_family_code, history.valid_from DESC;

CREATE VIEW app.dim_bolagsverket_representative_age_band AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'representative_age_band'::text));

CREATE VIEW app.dim_bolagsverket_representative_entity_type AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'representative_entity_type'::text));

CREATE VIEW app.dim_bolagsverket_representative_gender AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'representative_gender'::text));

CREATE VIEW app.dim_bolagsverket_representative_role AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'representative_role'::text));

CREATE VIEW app.dim_bolagsverket_statistics_event AS
 SELECT (code)::smallint AS code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'statistics_event'::text));

CREATE VIEW app.dim_bolagsverket_statistics_organization_form AS
 SELECT code,
    name
   FROM meta.code
  WHERE ((source = 'bolagsverket_statistics'::text) AND (domain = 'statistics_organization_form'::text));

CREATE VIEW app.dim_county AS
 SELECT DISTINCT ON (code) code,
    name
   FROM meta.code
  WHERE (domain = 'seat_county_code'::text)
  ORDER BY code,
        CASE source
            WHEN 'scb_api'::text THEN 0
            WHEN 'scb_bulk'::text THEN 1
            ELSE 2
        END;

CREATE VIEW app.dim_municipality AS
 SELECT DISTINCT ON (code) code,
    name,
    parent_code AS county_code
   FROM meta.code
  WHERE (domain = 'seat_municipality_code'::text)
  ORDER BY code,
        CASE source
            WHEN 'scb_api'::text THEN 0
            WHEN 'scb_bulk'::text THEN 1
            ELSE 2
        END;

CREATE TABLE app.overview_cache (
    scope text NOT NULL,
    payload jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '01:00:00'::interval) NOT NULL
);

COMMENT ON TABLE app.overview_cache IS 'Disposable overview responses with explicit generation and expiry times.';

COMMENT ON COLUMN app.overview_cache.generated_at IS 'Time when the cached response was calculated.';

COMMENT ON COLUMN app.overview_cache.expires_at IS 'Hard expiry; stale responses are never served.';

CREATE TABLE app.saved_segment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort jsonb DEFAULT '{}'::jsonb NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    match_profile_id uuid,
    source text DEFAULT 'manual'::text NOT NULL,
    result_count bigint,
    last_result_count_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE app.search_event (
    id bigint NOT NULL,
    search_id uuid NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    event_type text NOT NULL,
    outcome text NOT NULL,
    duration_ms numeric(12,2),
    search_mode text,
    query_length smallint,
    search_by text,
    fuzzy_used boolean,
    filter_count smallint,
    filter_keys text[] DEFAULT '{}'::text[] NOT NULL,
    result_count integer,
    total_value bigint,
    total_kind text,
    reformulated boolean DEFAULT false NOT NULL,
    company_id bigint,
    click_position integer,
    CONSTRAINT search_event_click_position_check CHECK (((click_position IS NULL) OR (click_position >= 1))),
    CONSTRAINT search_event_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms >= (0)::numeric))),
    CONSTRAINT search_event_event_type_check CHECK ((event_type = ANY (ARRAY['data'::text, 'count'::text, 'click'::text]))),
    CONSTRAINT search_event_filter_count_check CHECK (((filter_count IS NULL) OR (filter_count >= 0))),
    CONSTRAINT search_event_outcome_check CHECK ((outcome = ANY (ARRAY['ok'::text, 'timeout'::text, 'error'::text]))),
    CONSTRAINT search_event_query_length_check CHECK (((query_length IS NULL) OR (query_length >= 0))),
    CONSTRAINT search_event_result_count_check CHECK (((result_count IS NULL) OR (result_count >= 0))),
    CONSTRAINT search_event_search_by_check CHECK ((search_by = ANY (ARRAY['all'::text, 'company_name'::text, 'org_nr'::text]))),
    CONSTRAINT search_event_search_mode_check CHECK ((search_mode = ANY (ARRAY['results'::text, 'autocomplete'::text]))),
    CONSTRAINT search_event_total_kind_check CHECK ((total_kind = ANY (ARRAY['exact'::text, 'estimated'::text, 'none'::text]))),
    CONSTRAINT search_event_total_value_check CHECK (((total_value IS NULL) OR (total_value >= 0)))
);

ALTER TABLE app.search_event ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME app.search_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE core.company_change ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.company_change_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE core.company ALTER COLUMN company_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.company_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE core.company_event ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME core.company_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE core.company_industry (
    state_id bigint NOT NULL,
    rank smallint NOT NULL,
    sni_code text NOT NULL,
    sni_version text NOT NULL,
    source text NOT NULL,
    CONSTRAINT company_industry_rank_check CHECK (((rank >= 1) AND (rank <= 5))),
    CONSTRAINT company_industry_sni_code_check CHECK ((sni_code ~ '^[0-9]{5}$'::text))
);

CREATE VIEW core.company_industry_history AS
 SELECT s.company_id,
    i.state_id,
    i.rank,
    i.sni_code,
    i.sni_version,
    i.source,
    s.valid_from,
    s.valid_to,
    (i.rank = 1) AS is_primary
   FROM (core.company_industry i
     JOIN core.company_state_history s USING (state_id));

CREATE VIEW src_bolagsverket.organization_name_history AS
 SELECT h.company_id,
    h.source_key,
    h.source_subkey,
    n.organization_history_id,
    n.ordinal,
    n.name,
    n.name_type_code,
    n.registered_on,
    n.business_description,
    h.valid_from,
    h.valid_to
   FROM (src_bolagsverket.organization_name n
     JOIN src_bolagsverket.organization_history h ON ((h.id = n.organization_history_id)));

CREATE VIEW core.company_name_history AS
 SELECT organization_name_history.company_id,
    organization_name_history.name,
    organization_name_history.name_type_code,
    organization_name_history.source_subkey,
    organization_name_history.registered_on,
    organization_name_history.valid_from,
    organization_name_history.valid_to,
    'bolagsverket'::text AS source
   FROM src_bolagsverket.organization_name_history
UNION ALL
 SELECT company_state_history.company_id,
    company_state_history.company_name AS name,
    'entity_name'::text AS name_type_code,
    ''::text AS source_subkey,
    NULL::date AS registered_on,
    company_state_history.valid_from,
    company_state_history.valid_to,
    ((company_state_history.provenance -> 'company_name'::text) ->> 'source'::text) AS source
   FROM core.company_state_history
  WHERE (company_state_history.company_name IS NOT NULL)
UNION ALL
 SELECT company_state_history.company_id,
    company_state_history.registered_name AS name,
    'registered_name'::text AS name_type_code,
    ''::text AS source_subkey,
    NULL::date AS registered_on,
    company_state_history.valid_from,
    company_state_history.valid_to,
    ((company_state_history.provenance -> 'registered_name'::text) ->> 'source'::text) AS source
   FROM core.company_state_history
  WHERE (company_state_history.registered_name IS NOT NULL);

CREATE TABLE core.company_source_key (
    source text NOT NULL,
    source_key text NOT NULL,
    source_subkey text DEFAULT ''::text NOT NULL,
    company_id bigint NOT NULL
);

ALTER TABLE core.company_state_history ALTER COLUMN state_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME core.company_state_history_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE core.workplace (
    workplace_id bigint NOT NULL,
    company_id bigint NOT NULL,
    cfar_number text NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT workplace_cfar_number_check CHECK ((cfar_number ~ '^[0-9]{8}$'::text))
);

CREATE TABLE core.workplace_state_history (
    state_id bigint NOT NULL,
    workplace_id bigint NOT NULL,
    name text,
    postal_address text,
    postal_code text,
    postal_city text,
    visiting_address text,
    municipality_code text,
    county_code text,
    status_code text,
    employee_size_code text,
    state_hash text NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    created_by_run_id bigint NOT NULL,
    CONSTRAINT workplace_state_history_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from)))
);

CREATE VIEW core.workplace_current AS
 SELECT state_id,
    workplace_id,
    name,
    postal_address,
    postal_code,
    postal_city,
    visiting_address,
    municipality_code,
    county_code,
    status_code,
    employee_size_code,
    state_hash,
    valid_from,
    valid_to,
    created_by_run_id
   FROM core.workplace_state_history
  WHERE (valid_to IS NULL);

ALTER TABLE core.workplace_state_history ALTER COLUMN state_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME core.workplace_state_history_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE core.workplace ALTER COLUMN workplace_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME core.workplace_workplace_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE MATERIALIZED VIEW mart.bolagsverket_company_statistics_monthly AS
 WITH totals AS (
         SELECT statistics.period_start,
            statistics.event_code,
            (sum(statistics.count_ab))::bigint AS count_ab,
            (sum(statistics.count_bab))::bigint AS count_bab,
            (sum(statistics.count_bf))::bigint AS count_bf,
            (sum(statistics.count_brf))::bigint AS count_brf,
            (sum(statistics.count_ek))::bigint AS count_ek,
            (sum(statistics.count_e))::bigint AS count_e,
            (sum(statistics.count_se))::bigint AS count_se,
            (sum(statistics.count_fl))::bigint AS count_fl,
            (sum(statistics.count_fab))::bigint AS count_fab,
            (sum(statistics.count_hb))::bigint AS count_hb,
            (sum(statistics.count_i))::bigint AS count_i,
            (sum(statistics.count_kb))::bigint AS count_kb,
            (sum(statistics.count_khf))::bigint AS count_khf,
            (sum(statistics.count_mb))::bigint AS count_mb,
            (sum(statistics.count_sf))::bigint AS count_sf,
            (sum(statistics.count_sb))::bigint AS count_sb,
            (sum(statistics.count_tsf))::bigint AS count_tsf,
            (sum(statistics.count_bfl))::bigint AS count_bfl,
            (sum(statistics.count_ofb))::bigint AS count_ofb,
            (sum(statistics.count_sce))::bigint AS count_sce,
            (sum(statistics.count_s))::bigint AS count_s,
            (sum(statistics.count_egts))::bigint AS count_egts,
            (sum(statistics.count_fof))::bigint AS count_fof,
            (sum(statistics.count_tpab))::bigint AS count_tpab,
            (sum(statistics.count_otpb))::bigint AS count_otpb,
            (sum(statistics.count_tpf))::bigint AS count_tpf
           FROM app.bolagsverket_company_statistics statistics
          GROUP BY statistics.period_start, statistics.event_code
        )
 SELECT totals.period_start,
    totals.event_code,
    event.name AS event_name,
    form.organization_form_code,
    dimension.name AS organization_form_name,
    form.company_count
   FROM (((totals
     LEFT JOIN app.dim_bolagsverket_statistics_event event ON ((event.code = totals.event_code)))
     CROSS JOIN LATERAL ( VALUES ('AB'::text,totals.count_ab), ('BAB'::text,totals.count_bab), ('BF'::text,totals.count_bf), ('BRF'::text,totals.count_brf), ('EK'::text,totals.count_ek), ('E'::text,totals.count_e), ('SE'::text,totals.count_se), ('FL'::text,totals.count_fl), ('FAB'::text,totals.count_fab), ('HB'::text,totals.count_hb), ('I'::text,totals.count_i), ('KB'::text,totals.count_kb), ('KHF'::text,totals.count_khf), ('MB'::text,totals.count_mb), ('SF'::text,totals.count_sf), ('SB'::text,totals.count_sb), ('TSF'::text,totals.count_tsf), ('BFL'::text,totals.count_bfl), ('OFB'::text,totals.count_ofb), ('SCE'::text,totals.count_sce), ('S'::text,totals.count_s), ('EGTS'::text,totals.count_egts), ('FOF'::text,totals.count_fof), ('TPAB'::text,totals.count_tpab), ('OTPB'::text,totals.count_otpb), ('TPF'::text,totals.count_tpf)) form(organization_form_code, company_count))
     LEFT JOIN app.dim_bolagsverket_statistics_organization_form dimension ON ((dimension.code = form.organization_form_code)))
  WHERE (form.company_count IS NOT NULL)
  WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mart.bolagsverket_company_statistics_monthly IS 'National monthly totals by event and company form; refreshed after the companies statistics import.';

CREATE MATERIALIZED VIEW mart.bolagsverket_representative_statistics_yearly AS
 WITH totals AS (
         SELECT statistics.year,
            (sum(statistics.count_ak))::bigint AS count_ak,
            (sum(statistics.count_bo))::bigint AS count_bo,
            (sum(statistics.count_delg))::bigint AS count_delg,
            (sum(statistics.count_eft))::bigint AS count_eft,
            (sum(statistics.count_evd))::bigint AS count_evd,
            (sum(statistics.count_evvd))::bigint AS count_evvd,
            (sum(statistics.count_fo))::bigint AS count_fo,
            (sum(statistics.count_in))::bigint AS count_in,
            (sum(statistics.count_kd))::bigint AS count_kd,
            (sum(statistics.count_kp))::bigint AS count_kp,
            (sum(statistics.count_le))::bigint AS count_le,
            (sum(statistics.count_li))::bigint AS count_li,
            (sum(statistics.count_ls))::bigint AS count_ls,
            (sum(statistics.count_of))::bigint AS count_of,
            (sum(statistics.count_po))::bigint AS count_po,
            (sum(statistics.count_rep))::bigint AS count_rep,
            (sum(statistics.count_rev))::bigint AS count_rev,
            (sum(statistics.count_revh))::bigint AS count_revh,
            (sum(statistics.count_revl))::bigint AS count_revl,
            (sum(statistics.count_revs))::bigint AS count_revs,
            (sum(statistics.count_revsl))::bigint AS count_revsl,
            (sum(statistics.count_revst))::bigint AS count_revst,
            (sum(statistics.count_revt))::bigint AS count_revt,
            (sum(statistics.count_su))::bigint AS count_su,
            (sum(statistics.count_svd))::bigint AS count_svd,
            (sum(statistics.count_vd))::bigint AS count_vd,
            (sum(statistics.count_vle))::bigint AS count_vle,
            (sum(statistics.count_vof))::bigint AS count_vof,
            (sum(statistics.count_vvd))::bigint AS count_vvd
           FROM app.bolagsverket_representative_statistics statistics
          GROUP BY statistics.year
        )
 SELECT totals.year,
    role.representative_role_code,
    dimension.name AS representative_role_name,
    role.representative_count
   FROM ((totals
     CROSS JOIN LATERAL ( VALUES ('AK'::text,totals.count_ak), ('BO'::text,totals.count_bo), ('DELG'::text,totals.count_delg), ('EFT'::text,totals.count_eft), ('EVD'::text,totals.count_evd), ('EVVD'::text,totals.count_evvd), ('FO'::text,totals.count_fo), ('IN'::text,totals.count_in), ('KD'::text,totals.count_kd), ('KP'::text,totals.count_kp), ('LE'::text,totals.count_le), ('LI'::text,totals.count_li), ('LS'::text,totals.count_ls), ('OF'::text,totals.count_of), ('PO'::text,totals.count_po), ('REP'::text,totals.count_rep), ('REV'::text,totals.count_rev), ('REVH'::text,totals.count_revh), ('REVL'::text,totals.count_revl), ('REVS'::text,totals.count_revs), ('REVSL'::text,totals.count_revsl), ('REVST'::text,totals.count_revst), ('REVT'::text,totals.count_revt), ('SU'::text,totals.count_su), ('SVD'::text,totals.count_svd), ('VD'::text,totals.count_vd), ('VLE'::text,totals.count_vle), ('VOF'::text,totals.count_vof), ('VVD'::text,totals.count_vvd)) role(representative_role_code, representative_count))
     LEFT JOIN app.dim_bolagsverket_representative_role dimension ON ((dimension.code = role.representative_role_code)))
  WHERE (role.representative_count <> 0)
  WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mart.bolagsverket_representative_statistics_yearly IS 'National yearly role totals; refreshed after the representatives statistics import.';

CREATE VIEW mart.company_current AS
 SELECT company_id,
    activity_status_code,
    legal_form_code,
    primary_industry_code,
    seat_county_code,
    seat_municipality_code,
    employee_size_code,
    turnover_class_code,
    workplace_count,
    valid_from
   FROM core.company_current;

CREATE VIEW mart.company_state_history AS
 SELECT company_id,
    activity_status_code,
    legal_form_code,
    primary_industry_code,
    seat_county_code,
    seat_municipality_code,
    employee_size_code,
    turnover_class_code,
    workplace_count,
    valid_from,
    valid_to
   FROM core.company_state_history;

CREATE TABLE meta.data_quality_issue (
    id bigint NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint,
    issue_code text NOT NULL,
    detail text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

ALTER TABLE meta.data_quality_issue ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME meta.data_quality_issue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE meta.ingestion_run (
    id bigint NOT NULL,
    source text NOT NULL,
    dataset text DEFAULT 'company'::text NOT NULL,
    started_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    finished_at timestamp with time zone,
    source_as_of_date date,
    filename text,
    file_checksum text,
    schema_version text DEFAULT '2'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    records_seen bigint DEFAULT 0 NOT NULL,
    records_new bigint DEFAULT 0 NOT NULL,
    records_changed bigint DEFAULT 0 NOT NULL,
    records_skipped bigint DEFAULT 0 NOT NULL,
    last_row_number bigint DEFAULT 0 NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    error text,
    CONSTRAINT ingestion_run_records_changed_check CHECK ((records_changed >= 0)),
    CONSTRAINT ingestion_run_records_new_check CHECK ((records_new >= 0)),
    CONSTRAINT ingestion_run_records_seen_check CHECK ((records_seen >= 0)),
    CONSTRAINT ingestion_run_records_skipped_check CHECK ((records_skipped >= 0)),
    CONSTRAINT ingestion_run_status_check CHECK ((status = ANY (ARRAY['running'::text, 'done'::text, 'failed'::text, 'interrupted'::text])))
);

COMMENT ON COLUMN meta.ingestion_run.started_at IS 'Start of the Cintela import; also the stable observed_at for that run.';

COMMENT ON COLUMN meta.ingestion_run.finished_at IS 'Time when the Cintela import finished, independent of source dates.';

COMMENT ON COLUMN meta.ingestion_run.source_as_of_date IS 'Publisher reference date; never inferred from the Cintela import time.';

ALTER TABLE meta.ingestion_run ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME meta.ingestion_run_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE meta.source (
    code text NOT NULL,
    name text NOT NULL
);

CREATE TABLE raw.statistics_record (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT statistics_record_raw_hash_check CHECK ((raw_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_record_row_number_check CHECK ((row_number > 1))
)
PARTITION BY LIST (dataset);

CREATE TABLE raw.bolagsverket_auditor_reservation_statistics (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT statistics_record_raw_hash_check CHECK ((raw_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_record_row_number_check CHECK ((row_number > 1))
);

CREATE TABLE raw.company_record (
    source text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
)
PARTITION BY LIST (source);

COMMENT ON COLUMN raw.company_record.observed_at IS 'Stable import observation time copied from meta.ingestion_run.started_at.';

CREATE TABLE raw.bolagsverket_company (
    source text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE raw.bolagsverket_company_statistics (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT statistics_record_raw_hash_check CHECK ((raw_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_record_row_number_check CHECK ((row_number > 1))
);

CREATE TABLE raw.bolagsverket_filing_delay_statistics (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT statistics_record_raw_hash_check CHECK ((raw_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_record_row_number_check CHECK ((row_number > 1))
);

CREATE TABLE raw.bolagsverket_representative_statistics (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT statistics_record_raw_hash_check CHECK ((raw_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_record_row_number_check CHECK ((row_number > 1))
);

CREATE TABLE raw.legacy_company (
    source text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE raw.scb_api_company (
    source text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE raw.scb_bulk_company (
    source text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL,
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL,
    observed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

ALTER TABLE src_bolagsverket.organization_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME src_bolagsverket.organization_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE VIEW src_bolagsverket.organization_procedure_history AS
 SELECT h.company_id,
    h.source_key,
    h.source_subkey,
    p.organization_history_id,
    p.ordinal,
    p.procedure_code,
    p.procedure_text,
    p.started_on,
    h.valid_from,
    h.valid_to
   FROM (src_bolagsverket.organization_procedure p
     JOIN src_bolagsverket.organization_history h ON ((h.id = p.organization_history_id)));

ALTER TABLE src_bolagsverket.statistics_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME src_bolagsverket.statistics_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE src_bolagsverket.statistics_import_stage (
    ingestion_run_id bigint NOT NULL,
    dataset text NOT NULL,
    row_number bigint NOT NULL,
    natural_key jsonb NOT NULL,
    natural_key_hash text NOT NULL,
    data jsonb NOT NULL,
    row_hash text NOT NULL,
    CONSTRAINT statistics_import_stage_data_check CHECK ((jsonb_typeof(data) = 'object'::text)),
    CONSTRAINT statistics_import_stage_natural_key_check CHECK ((jsonb_typeof(natural_key) = 'object'::text)),
    CONSTRAINT statistics_import_stage_natural_key_hash_check CHECK ((natural_key_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_import_stage_row_hash_check CHECK ((row_hash ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT statistics_import_stage_row_number_check CHECK ((row_number > 1))
);

CREATE TABLE src_scb.company_history (
    id bigint NOT NULL,
    source text NOT NULL,
    source_key text NOT NULL,
    source_subkey text DEFAULT ''::text NOT NULL,
    company_id bigint NOT NULL,
    data jsonb NOT NULL,
    row_hash text NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    first_ingestion_run_id bigint NOT NULL,
    last_ingestion_run_id bigint NOT NULL,
    first_row_number bigint NOT NULL,
    last_row_number bigint NOT NULL,
    CONSTRAINT company_history_check CHECK (((valid_to IS NULL) OR (valid_to > valid_from))),
    CONSTRAINT company_history_data_check CHECK ((jsonb_typeof(data) = 'object'::text)),
    CONSTRAINT company_history_source_check CHECK ((source = ANY (ARRAY['scb_api'::text, 'scb_bulk'::text, 'legacy'::text])))
);

CREATE VIEW src_scb.api_company_history AS
 SELECT id,
    source,
    source_key,
    source_subkey,
    company_id,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_scb.company_history
  WHERE (source = 'scb_api'::text);

CREATE VIEW src_scb.api_company_current AS
 SELECT id,
    source,
    source_key,
    source_subkey,
    company_id,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_scb.api_company_history
  WHERE (valid_to IS NULL);

CREATE VIEW src_scb.bulk_company_history AS
 SELECT id,
    source,
    source_key,
    source_subkey,
    company_id,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_scb.company_history
  WHERE (source = 'scb_bulk'::text);

CREATE VIEW src_scb.bulk_company_current AS
 SELECT id,
    source,
    source_key,
    source_subkey,
    company_id,
    data,
    row_hash,
    valid_from,
    valid_to,
    first_ingestion_run_id,
    last_ingestion_run_id,
    first_row_number,
    last_row_number
   FROM src_scb.bulk_company_history
  WHERE (valid_to IS NULL);

ALTER TABLE src_scb.company_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME src_scb.company_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY raw.statistics_record ATTACH PARTITION raw.bolagsverket_auditor_reservation_statistics FOR VALUES IN ('auditor_reservations');

ALTER TABLE ONLY raw.company_record ATTACH PARTITION raw.bolagsverket_company FOR VALUES IN ('bolagsverket');

ALTER TABLE ONLY raw.statistics_record ATTACH PARTITION raw.bolagsverket_company_statistics FOR VALUES IN ('companies');

ALTER TABLE ONLY raw.statistics_record ATTACH PARTITION raw.bolagsverket_filing_delay_statistics FOR VALUES IN ('filing_delays');

ALTER TABLE ONLY raw.statistics_record ATTACH PARTITION raw.bolagsverket_representative_statistics FOR VALUES IN ('representatives');

ALTER TABLE ONLY raw.company_record ATTACH PARTITION raw.legacy_company FOR VALUES IN ('legacy');

ALTER TABLE ONLY raw.company_record ATTACH PARTITION raw.scb_api_company FOR VALUES IN ('scb_api');

ALTER TABLE ONLY raw.company_record ATTACH PARTITION raw.scb_bulk_company FOR VALUES IN ('scb_bulk');

ALTER TABLE ONLY app.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY app.overview_cache
    ADD CONSTRAINT overview_cache_pkey PRIMARY KEY (scope);

ALTER TABLE ONLY app.saved_segment
    ADD CONSTRAINT saved_segment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY app.saved_segment
    ADD CONSTRAINT saved_segment_user_id_id_key UNIQUE (user_id, id);

ALTER TABLE ONLY app.search_event
    ADD CONSTRAINT search_event_pkey PRIMARY KEY (id);

ALTER TABLE ONLY core.company_change
    ADD CONSTRAINT company_change_pkey PRIMARY KEY (id);

ALTER TABLE ONLY core.company_event
    ADD CONSTRAINT company_event_pkey PRIMARY KEY (id);

ALTER TABLE ONLY core.company_identifier
    ADD CONSTRAINT company_identifier_company_id_identity_type_key UNIQUE (company_id, identity_type);

ALTER TABLE ONLY core.company_identifier
    ADD CONSTRAINT company_identifier_pkey PRIMARY KEY (identity_type, identity_value);

ALTER TABLE ONLY core.company_industry
    ADD CONSTRAINT company_industry_pkey PRIMARY KEY (state_id, rank);

ALTER TABLE ONLY core.company_industry
    ADD CONSTRAINT company_industry_state_id_sni_code_key UNIQUE (state_id, sni_code);

ALTER TABLE ONLY core.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);

ALTER TABLE ONLY core.company_source_key
    ADD CONSTRAINT company_source_key_pkey PRIMARY KEY (source, source_key, source_subkey);

ALTER TABLE ONLY core.company_state_history
    ADD CONSTRAINT company_state_history_pkey PRIMARY KEY (state_id);

ALTER TABLE ONLY core.workplace
    ADD CONSTRAINT workplace_cfar_number_key UNIQUE (cfar_number);

ALTER TABLE ONLY core.workplace
    ADD CONSTRAINT workplace_pkey PRIMARY KEY (workplace_id);

ALTER TABLE ONLY core.workplace_state_history
    ADD CONSTRAINT workplace_state_history_pkey PRIMARY KEY (state_id);

ALTER TABLE ONLY meta.code
    ADD CONSTRAINT code_pkey PRIMARY KEY (source, domain, code);

ALTER TABLE ONLY meta.data_quality_issue
    ADD CONSTRAINT data_quality_issue_pkey PRIMARY KEY (id);

ALTER TABLE ONLY meta.ingestion_run
    ADD CONSTRAINT ingestion_run_dataset_identity UNIQUE (dataset, id);

ALTER TABLE ONLY meta.ingestion_run
    ADD CONSTRAINT ingestion_run_pkey PRIMARY KEY (id);

ALTER TABLE ONLY meta.source
    ADD CONSTRAINT source_pkey PRIMARY KEY (code);

ALTER TABLE ONLY raw.statistics_record
    ADD CONSTRAINT statistics_record_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.bolagsverket_auditor_reservation_statistics
    ADD CONSTRAINT bolagsverket_auditor_reservation_statistics_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.company_record
    ADD CONSTRAINT company_record_pkey PRIMARY KEY (source, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.bolagsverket_company
    ADD CONSTRAINT bolagsverket_company_pkey PRIMARY KEY (source, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.bolagsverket_company_statistics
    ADD CONSTRAINT bolagsverket_company_statistics_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.bolagsverket_filing_delay_statistics
    ADD CONSTRAINT bolagsverket_filing_delay_statistics_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.bolagsverket_representative_statistics
    ADD CONSTRAINT bolagsverket_representative_statistics_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.legacy_company
    ADD CONSTRAINT legacy_company_pkey PRIMARY KEY (source, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.scb_api_company
    ADD CONSTRAINT scb_api_company_pkey PRIMARY KEY (source, ingestion_run_id, row_number);

ALTER TABLE ONLY raw.scb_bulk_company
    ADD CONSTRAINT scb_bulk_company_pkey PRIMARY KEY (source, ingestion_run_id, row_number);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY src_bolagsverket.organization_name
    ADD CONSTRAINT organization_name_pkey PRIMARY KEY (organization_history_id, ordinal);

ALTER TABLE ONLY src_bolagsverket.organization_procedure
    ADD CONSTRAINT organization_procedure_pkey PRIMARY KEY (organization_history_id, ordinal);

ALTER TABLE ONLY src_bolagsverket.statistics_history
    ADD CONSTRAINT statistics_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY src_bolagsverket.statistics_import_stage
    ADD CONSTRAINT statistics_import_stage_dataset_ingestion_run_id_natural_ke_key UNIQUE (dataset, ingestion_run_id, natural_key_hash);

ALTER TABLE ONLY src_bolagsverket.statistics_import_stage
    ADD CONSTRAINT statistics_import_stage_pkey PRIMARY KEY (dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX app_user_auth ON app.app_user USING btree (auth_provider, auth_subject) WHERE ((auth_provider IS NOT NULL) AND (auth_subject IS NOT NULL));

CREATE INDEX app_user_company ON app.app_user USING btree (company_id);

CREATE UNIQUE INDEX app_user_email ON app.app_user USING btree (lower(email)) WHERE (email IS NOT NULL);

CREATE INDEX overview_cache_expires_at ON app.overview_cache USING btree (expires_at);

CREATE INDEX saved_segment_user_updated ON app.saved_segment USING btree (user_id, updated_at DESC);

CREATE INDEX search_event_observed_at ON app.search_event USING btree (observed_at DESC);

CREATE INDEX search_event_search_id ON app.search_event USING btree (search_id, observed_at);

CREATE INDEX company_activity ON core.company_state_history USING btree (activity_status_code) WHERE (valid_to IS NULL);

CREATE INDEX company_change_timeline ON core.company_change USING btree (company_id, detected_at DESC);

CREATE INDEX company_current_advertising_status ON core.company_state_history USING btree (advertising_status_code) WHERE ((valid_to IS NULL) AND (advertising_status_code IS NOT NULL));

CREATE INDEX company_current_combined_name_tokens ON core.company_state_history USING gin (to_tsvector('simple'::regconfig, ((COALESCE(company_name, ''::text) || ' '::text) || COALESCE(registered_name, ''::text)))) WHERE (valid_to IS NULL);

CREATE INDEX company_current_company_state ON core.company_state_history USING btree (company_state_code) WHERE ((valid_to IS NULL) AND (company_state_code IS NOT NULL));

CREATE INDEX company_current_employee_sort_asc ON core.company_state_history USING btree (((employee_size_code)::integer), company_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_employee_sort_asc_name_desc ON core.company_state_history USING btree (((employee_size_code)::integer), company_name DESC NULLS LAST, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_employee_sort_desc ON core.company_state_history USING btree (((employee_size_code)::integer) DESC NULLS LAST, company_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_employee_sort_desc_name_desc ON core.company_state_history USING btree (((employee_size_code)::integer) DESC NULLS LAST, company_name DESC NULLS LAST, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_employer_status ON core.company_state_history USING btree (employer_status_code) WHERE ((valid_to IS NULL) AND (employer_status_code IS NOT NULL));

CREATE INDEX company_current_f_tax_status ON core.company_state_history USING btree (f_tax_status_code) WHERE ((valid_to IS NULL) AND (f_tax_status_code IS NOT NULL));

CREATE INDEX company_current_geography_activity_age ON core.company_state_history USING btree (seat_county_code, activity_status_code, COALESCE(start_date, scb_registration_date) DESC, turnover_class_code, company_name, company_id) INCLUDE (state_id, employee_size_code) WHERE (valid_to IS NULL);

CREATE INDEX company_current_industry_section ON core.company_state_history USING btree (industry_section_code) WHERE ((valid_to IS NULL) AND (industry_section_code IS NOT NULL));

CREATE INDEX company_current_municipality ON core.company_state_history USING btree (seat_municipality_code) WHERE (valid_to IS NULL);

CREATE INDEX company_current_name_order ON core.company_state_history USING btree (company_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_name_order_desc ON core.company_state_history USING btree (company_name DESC NULLS LAST, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_name_prefix ON core.company_state_history USING btree (lower(company_name) text_pattern_ops, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_name_tokens ON core.company_state_history USING gin (to_tsvector('simple'::regconfig, COALESCE(company_name, ''::text))) WHERE (valid_to IS NULL);

CREATE INDEX company_current_never_active_turnover_desc ON core.company_state_history USING btree (((turnover_class_code)::integer) DESC NULLS LAST, company_name, company_id) INCLUDE (state_id, company_state_code, employee_size_code) WHERE ((valid_to IS NULL) AND (activity_status_code = '0'::text));

CREATE INDEX company_current_organization_form ON core.company_state_history USING btree (organization_form_code) WHERE (valid_to IS NULL);

CREATE INDEX company_current_ownership_category ON core.company_state_history USING btree (ownership_category_code) WHERE ((valid_to IS NULL) AND (ownership_category_code IS NOT NULL));

CREATE INDEX company_current_postal_city_search ON core.company_state_history USING gin (postal_city extensions.gin_trgm_ops) WHERE (valid_to IS NULL);

CREATE INDEX company_current_postal_code_digits ON core.company_state_history USING btree (regexp_replace(postal_code, '\s+'::text, ''::text, 'g'::text)) WHERE (valid_to IS NULL);

CREATE INDEX company_current_regional_overview ON core.company_state_history USING btree (seat_county_code, seat_municipality_code) INCLUDE (region_code, primary_industry_code, employee_size_code, turnover_class_code, activity_status_code, employer_status_code, company_state_code) WHERE (valid_to IS NULL);

CREATE INDEX company_current_registered_name_order ON core.company_state_history USING btree (registered_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_registered_name_prefix ON core.company_state_history USING btree (lower(registered_name) text_pattern_ops, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_registered_name_tokens ON core.company_state_history USING gin (to_tsvector('simple'::regconfig, COALESCE(registered_name, ''::text))) WHERE (valid_to IS NULL);

CREATE INDEX company_current_registration_date ON core.company_state_history USING btree (COALESCE(start_date, scb_registration_date), company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_search_scope_lookup ON core.company_state_history USING btree (company_id) INCLUDE (state_id, company_name, seat_county_code, seat_municipality_code, activity_status_code, company_state_code, employer_status_code, vat_status_code, f_tax_status_code, advertising_status_code, employee_size_code, start_date, scb_registration_date, postal_city, postal_code, ownership_category_code, sme_size_code, trade_indicator, industry_section_code, primary_industry_code, turnover_class_code) WHERE (valid_to IS NULL);

CREATE INDEX company_current_sme_size ON core.company_state_history USING btree (sme_size_code) WHERE ((valid_to IS NULL) AND (sme_size_code IS NOT NULL));

CREATE INDEX company_current_trade_indicator ON core.company_state_history USING btree (trade_indicator) WHERE ((valid_to IS NULL) AND (trade_indicator IS NOT NULL));

CREATE INDEX company_current_turnover_sort_asc ON core.company_state_history USING btree (((turnover_class_code)::integer), company_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_turnover_sort_asc_name_desc ON core.company_state_history USING btree (((turnover_class_code)::integer), company_name DESC NULLS LAST, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_turnover_sort_desc ON core.company_state_history USING btree (((turnover_class_code)::integer) DESC NULLS LAST, company_name, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_turnover_sort_desc_name_desc ON core.company_state_history USING btree (((turnover_class_code)::integer) DESC NULLS LAST, company_name DESC NULLS LAST, company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_current_vat_status ON core.company_state_history USING btree (vat_status_code) WHERE ((valid_to IS NULL) AND (vat_status_code IS NOT NULL));

CREATE INDEX company_employees ON core.company_state_history USING btree (employee_size_code) WHERE (valid_to IS NULL);

CREATE INDEX company_event_timeline ON core.company_event USING btree (company_id, detected_at DESC);

CREATE INDEX company_geography ON core.company_state_history USING btree (seat_county_code, seat_municipality_code) WHERE (valid_to IS NULL);

CREATE INDEX company_identifier_company ON core.company_identifier USING btree (company_id);

CREATE INDEX company_identifier_person_short ON core.company_identifier USING btree ("right"(identity_value, 10)) WHERE (identity_type = 'PERSON'::text);

CREATE INDEX company_industry_sni ON core.company_industry USING btree (sni_version, sni_code, state_id);

CREATE INDEX company_name_search ON core.company_state_history USING gin (company_name extensions.gin_trgm_ops) WHERE (valid_to IS NULL);

CREATE INDEX company_primary_industry ON core.company_state_history USING btree (primary_industry_code) WHERE (valid_to IS NULL);

CREATE INDEX company_registered_name_search ON core.company_state_history USING gin (registered_name extensions.gin_trgm_ops) WHERE (valid_to IS NULL);

CREATE INDEX company_source_key_company ON core.company_source_key USING btree (company_id, source);

CREATE INDEX company_state_as_of ON core.company_state_history USING btree (company_id, valid_from DESC);

CREATE UNIQUE INDEX company_state_current ON core.company_state_history USING btree (company_id) WHERE (valid_to IS NULL);

CREATE INDEX company_turnover ON core.company_state_history USING btree (turnover_class_code) WHERE (valid_to IS NULL);

CREATE INDEX workplace_company ON core.workplace USING btree (company_id);

CREATE UNIQUE INDEX workplace_state_current ON core.workplace_state_history USING btree (workplace_id) WHERE (valid_to IS NULL);

CREATE UNIQUE INDEX bolagsverket_company_statistics_monthly_key ON mart.bolagsverket_company_statistics_monthly USING btree (period_start, event_code, organization_form_code);

CREATE UNIQUE INDEX bolagsverket_representative_statistics_yearly_key ON mart.bolagsverket_representative_statistics_yearly USING btree (year, representative_role_code);

CREATE INDEX code_domain_lookup ON meta.code USING btree (domain, code, source) INCLUDE (name, parent_code);

CREATE INDEX ingestion_run_dataset_file ON meta.ingestion_run USING btree (source, dataset, file_checksum, id DESC);

CREATE INDEX ingestion_run_file ON meta.ingestion_run USING btree (source, file_checksum, id DESC);

CREATE UNIQUE INDEX organization_current_key ON src_bolagsverket.organization_history USING btree (source_key, source_subkey) WHERE (valid_to IS NULL);

CREATE INDEX organization_history_current_name_lookup ON src_bolagsverket.organization_history USING btree (id) INCLUDE (company_id) WHERE (valid_to IS NULL);

CREATE INDEX organization_name_prefix ON src_bolagsverket.organization_name USING btree (lower(name) text_pattern_ops);

CREATE INDEX organization_name_search ON src_bolagsverket.organization_name USING gin (name extensions.gin_trgm_ops);

CREATE INDEX organization_name_tokens ON src_bolagsverket.organization_name USING gin (to_tsvector('simple'::regconfig, COALESCE(name, ''::text)));

CREATE INDEX organization_versions ON src_bolagsverket.organization_history USING btree (company_id, valid_from DESC);

CREATE INDEX statistics_current_auditor_year ON src_bolagsverket.statistics_history USING btree (((data ->> 'registration_year'::text))) WHERE ((dataset = 'auditor_reservations'::text) AND (valid_to IS NULL));

CREATE INDEX statistics_current_company_period ON src_bolagsverket.statistics_history USING btree (((data ->> 'period_start'::text)), ((data ->> 'event_code'::text)), ((data ->> 'county_code'::text)), ((data ->> 'municipality_code'::text))) WHERE ((dataset = 'companies'::text) AND (valid_to IS NULL));

CREATE INDEX statistics_current_filing_year ON src_bolagsverket.statistics_history USING btree (((data ->> 'period_through_year'::text))) WHERE ((dataset = 'filing_delays'::text) AND (valid_to IS NULL));

CREATE UNIQUE INDEX statistics_current_key ON src_bolagsverket.statistics_history USING btree (dataset, natural_key_hash) WHERE (valid_to IS NULL);

CREATE INDEX statistics_current_representative_dimensions ON src_bolagsverket.statistics_history USING btree (((data ->> 'year'::text)), ((data ->> 'organization_form_code'::text)), ((data ->> 'county_code'::text)), ((data ->> 'municipality_code'::text))) WHERE ((dataset = 'representatives'::text) AND (valid_to IS NULL));

CREATE INDEX statistics_versions ON src_bolagsverket.statistics_history USING btree (dataset, natural_key_hash, valid_from DESC);

CREATE UNIQUE INDEX scb_company_current ON src_scb.company_history USING btree (source, source_key, source_subkey) WHERE (valid_to IS NULL);

CREATE INDEX scb_company_versions ON src_scb.company_history USING btree (company_id, source, valid_from DESC);

ALTER INDEX raw.statistics_record_pkey ATTACH PARTITION raw.bolagsverket_auditor_reservation_statistics_pkey;

ALTER INDEX raw.company_record_pkey ATTACH PARTITION raw.bolagsverket_company_pkey;

ALTER INDEX raw.statistics_record_pkey ATTACH PARTITION raw.bolagsverket_company_statistics_pkey;

ALTER INDEX raw.statistics_record_pkey ATTACH PARTITION raw.bolagsverket_filing_delay_statistics_pkey;

ALTER INDEX raw.statistics_record_pkey ATTACH PARTITION raw.bolagsverket_representative_statistics_pkey;

ALTER INDEX raw.company_record_pkey ATTACH PARTITION raw.legacy_company_pkey;

ALTER INDEX raw.company_record_pkey ATTACH PARTITION raw.scb_api_company_pkey;

ALTER INDEX raw.company_record_pkey ATTACH PARTITION raw.scb_bulk_company_pkey;

CREATE STATISTICS app.company_current_geography_filter_stats (dependencies, mcv) ON seat_municipality_code, seat_county_code, activity_status_code, industry_section_code FROM core.company_state_history;

CREATE STATISTICS app.company_current_pagination_filter_stats (dependencies, mcv) ON seat_county_code, activity_status_code, turnover_class_code, COALESCE(start_date, scb_registration_date) FROM core.company_state_history;

CREATE STATISTICS app.company_current_registry_filter_stats (dependencies, mcv) ON activity_status_code, employer_status_code, vat_status_code, f_tax_status_code, company_state_code FROM core.company_state_history;

CREATE TRIGGER immutable_company_record BEFORE DELETE OR UPDATE ON raw.company_record FOR EACH ROW EXECUTE FUNCTION raw.reject_mutation();

CREATE TRIGGER immutable_statistics_record BEFORE DELETE OR UPDATE ON raw.statistics_record FOR EACH ROW EXECUTE FUNCTION raw.reject_mutation();

ALTER TABLE ONLY app.app_user
    ADD CONSTRAINT app_user_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY app.saved_segment
    ADD CONSTRAINT saved_segment_user_id_fkey FOREIGN KEY (user_id) REFERENCES app.app_user(id) ON DELETE CASCADE;

ALTER TABLE ONLY app.search_event
    ADD CONSTRAINT search_event_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_change
    ADD CONSTRAINT company_change_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_change
    ADD CONSTRAINT company_change_ingestion_run_id_fkey FOREIGN KEY (ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY core.company_change
    ADD CONSTRAINT company_change_state_id_fkey FOREIGN KEY (state_id) REFERENCES core.company_state_history(state_id);

ALTER TABLE ONLY core.company_event
    ADD CONSTRAINT company_event_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_event
    ADD CONSTRAINT company_event_ingestion_run_id_fkey FOREIGN KEY (ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY core.company_identifier
    ADD CONSTRAINT company_identifier_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_industry
    ADD CONSTRAINT company_industry_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE ONLY core.company_industry
    ADD CONSTRAINT company_industry_state_id_fkey FOREIGN KEY (state_id) REFERENCES core.company_state_history(state_id);

ALTER TABLE ONLY core.company_source_key
    ADD CONSTRAINT company_source_key_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_source_key
    ADD CONSTRAINT company_source_key_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE ONLY core.company_state_history
    ADD CONSTRAINT company_state_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.company_state_history
    ADD CONSTRAINT company_state_history_created_by_run_id_fkey FOREIGN KEY (created_by_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY core.workplace
    ADD CONSTRAINT workplace_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY core.workplace_state_history
    ADD CONSTRAINT workplace_state_history_created_by_run_id_fkey FOREIGN KEY (created_by_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY core.workplace_state_history
    ADD CONSTRAINT workplace_state_history_workplace_id_fkey FOREIGN KEY (workplace_id) REFERENCES core.workplace(workplace_id);

ALTER TABLE ONLY meta.code
    ADD CONSTRAINT code_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE ONLY meta.data_quality_issue
    ADD CONSTRAINT data_quality_issue_ingestion_run_id_fkey FOREIGN KEY (ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY meta.ingestion_run
    ADD CONSTRAINT ingestion_run_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE raw.company_record
    ADD CONSTRAINT company_record_ingestion_run_id_fkey FOREIGN KEY (ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE raw.company_record
    ADD CONSTRAINT company_record_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE raw.statistics_record
    ADD CONSTRAINT statistics_record_dataset_ingestion_run_id_fkey FOREIGN KEY (dataset, ingestion_run_id) REFERENCES meta.ingestion_run(dataset, id);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_first_ingestion_run_id_fkey FOREIGN KEY (first_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_last_ingestion_run_id_fkey FOREIGN KEY (last_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_source_first_ingestion_run_id_first_r_fkey FOREIGN KEY (source, first_ingestion_run_id, first_row_number) REFERENCES raw.company_record(source, ingestion_run_id, row_number);

ALTER TABLE ONLY src_bolagsverket.organization_history
    ADD CONSTRAINT organization_history_source_last_ingestion_run_id_last_row_fkey FOREIGN KEY (source, last_ingestion_run_id, last_row_number) REFERENCES raw.company_record(source, ingestion_run_id, row_number);

ALTER TABLE ONLY src_bolagsverket.organization_name
    ADD CONSTRAINT organization_name_organization_history_id_fkey FOREIGN KEY (organization_history_id) REFERENCES src_bolagsverket.organization_history(id);

ALTER TABLE ONLY src_bolagsverket.organization_procedure
    ADD CONSTRAINT organization_procedure_organization_history_id_fkey FOREIGN KEY (organization_history_id) REFERENCES src_bolagsverket.organization_history(id);

ALTER TABLE ONLY src_bolagsverket.statistics_history
    ADD CONSTRAINT statistics_history_dataset_first_ingestion_run_id_first_ro_fkey FOREIGN KEY (dataset, first_ingestion_run_id, first_row_number) REFERENCES raw.statistics_record(dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY src_bolagsverket.statistics_history
    ADD CONSTRAINT statistics_history_dataset_last_ingestion_run_id_last_row__fkey FOREIGN KEY (dataset, last_ingestion_run_id, last_row_number) REFERENCES raw.statistics_record(dataset, ingestion_run_id, row_number);

ALTER TABLE ONLY src_bolagsverket.statistics_history
    ADD CONSTRAINT statistics_history_first_ingestion_run_id_fkey FOREIGN KEY (first_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_bolagsverket.statistics_history
    ADD CONSTRAINT statistics_history_last_ingestion_run_id_fkey FOREIGN KEY (last_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_bolagsverket.statistics_import_stage
    ADD CONSTRAINT statistics_import_stage_dataset_ingestion_run_id_fkey FOREIGN KEY (dataset, ingestion_run_id) REFERENCES meta.ingestion_run(dataset, id);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.company(company_id);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_first_ingestion_run_id_fkey FOREIGN KEY (first_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_last_ingestion_run_id_fkey FOREIGN KEY (last_ingestion_run_id) REFERENCES meta.ingestion_run(id);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_source_first_ingestion_run_id_first_row_nu_fkey FOREIGN KEY (source, first_ingestion_run_id, first_row_number) REFERENCES raw.company_record(source, ingestion_run_id, row_number);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_source_fkey FOREIGN KEY (source) REFERENCES meta.source(code);

ALTER TABLE ONLY src_scb.company_history
    ADD CONSTRAINT company_history_source_last_ingestion_run_id_last_row_numb_fkey FOREIGN KEY (source, last_ingestion_run_id, last_row_number) REFERENCES raw.company_record(source, ingestion_run_id, row_number);

INSERT INTO meta.source VALUES
    ('scb_api', 'SCB API'), ('scb_bulk', 'SCB bulk'),
    ('bolagsverket', 'Bolagsverket bulk'), ('legacy', 'Migrated v1 data');

INSERT INTO meta.code(source, domain, code, name) VALUES
    ('bolagsverket', 'organization_form_code', 'AB-ORGFO', 'Aktiebolag'),
    ('bolagsverket', 'organization_form_code', 'BAB-ORGFO', 'Bankaktiebolag'),
    ('bolagsverket', 'organization_form_code', 'BF-ORGFO', 'Bostadsförening'),
    ('bolagsverket', 'organization_form_code', 'BFL-ORGFO', 'Utländsk banks filial'),
    ('bolagsverket', 'organization_form_code', 'BRF-ORGFO', 'Bostadsrättsförening'),
    ('bolagsverket', 'organization_form_code', 'E-ORGFO', 'Enskild näringsverksamhet'),
    ('bolagsverket', 'organization_form_code', 'EB-ORGFO', 'Enkla bolag'),
    ('bolagsverket', 'organization_form_code', 'EEIG-ORGFO', 'Europeisk ekonomisk intressegruppering'),
    ('bolagsverket', 'organization_form_code', 'EGTS-ORGFO', 'Europeisk gruppering för territoriellt samarbete'),
    ('bolagsverket', 'organization_form_code', 'EK-ORGFO', 'Ekonomisk förening'),
    ('bolagsverket', 'organization_form_code', 'FAB-ORGFO', 'Försäkringsaktiebolag'),
    ('bolagsverket', 'organization_form_code', 'FF-ORGFO', 'Försäkringsförmedlare'),
    ('bolagsverket', 'organization_form_code', 'FL-ORGFO', 'Filial'),
    ('bolagsverket', 'organization_form_code', 'FOF-ORGFO', 'Försäkringsförening'),
    ('bolagsverket', 'organization_form_code', 'HB-ORGFO', 'Handelsbolag'),
    ('bolagsverket', 'organization_form_code', 'I-ORGFO', 'Ideell förening som bedriver näringsverksamhet'),
    ('bolagsverket', 'organization_form_code', 'KB-ORGFO', 'Kommanditbolag'),
    ('bolagsverket', 'organization_form_code', 'KHF-ORGFO', 'Kooperativ hyresrättsförening'),
    ('bolagsverket', 'organization_form_code', 'MB-ORGFO', 'Medlemsbank'),
    ('bolagsverket', 'organization_form_code', 'OFB-ORGFO', 'Ömsesidigt försäkringsbolag'),
    ('bolagsverket', 'organization_form_code', 'OTPB-ORGFO', 'Ömsesidigt tjänstepensionsbolag'),
    ('bolagsverket', 'organization_form_code', 'S-ORGFO', 'Stiftelse som bedriver näringsverksamhet'),
    ('bolagsverket', 'organization_form_code', 'SB-ORGFO', 'Sparbank'),
    ('bolagsverket', 'organization_form_code', 'SCE-ORGFO', 'Europakooperativ'),
    ('bolagsverket', 'organization_form_code', 'SE-ORGFO', 'Europabolag'),
    ('bolagsverket', 'organization_form_code', 'SF-ORGFO', 'Sambruksförening'),
    ('bolagsverket', 'organization_form_code', 'TPAB-ORGFO', 'Tjänstepensionsaktiebolag'),
    ('bolagsverket', 'organization_form_code', 'TPF-ORGFO', 'Tjänstepensionsförening'),
    ('bolagsverket', 'organization_form_code', 'TSF-ORGFO', 'Trossamfund som bedriver näringsverksamhet');

INSERT INTO app.app_user(id, display_name) VALUES ('00000000-0000-0000-0000-000000000001', 'MVP User');

INSERT INTO meta.source(code, name)
VALUES ('bolagsverket_statistics', 'Bolagsverkets öppna statistik')
ON CONFLICT (code) DO UPDATE SET name = excluded.name;

INSERT INTO meta.code(source, domain, code, name) VALUES
    ('bolagsverket_statistics', 'statistics_event', '1', 'Nyregistrerade'),
    ('bolagsverket_statistics', 'statistics_event', '2', 'Alla registrerade'),
    ('bolagsverket_statistics', 'statistics_event', '3', 'Avslutade'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'AB', 'Aktiebolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'BAB', 'Bankaktiebolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'BF', 'Bostadsförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'BFL', 'Utländsk banks filial'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'BRF', 'Bostadsrättsförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'E', 'Enskild näringsidkare'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'EGTS', 'Europeisk gruppering för territoriellt samarbete'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'EK', 'Ekonomisk förening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'FAB', 'Försäkringsaktiebolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'FL', 'Filial'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'FOF', 'Försäkringsförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'HB', 'Handelsbolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'I', 'Ideell förening som bedriver näringsverksamhet'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'KB', 'Kommanditbolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'KHF', 'Kooperativ hyresrättsförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'MB', 'Medlemsbank'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'OFB', 'Ömsesidigt försäkringsbolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'OTPB', 'Ömsesidigt tjänstepensionsbolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'S', 'Stiftelse som bedriver näringsverksamhet'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'SB', 'Sparbank'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'SCE', 'Europakooperativ'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'SE', 'Europabolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'SF', 'Sambruksförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'TPAB', 'Tjänstepensionsaktiebolag'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'TPF', 'Tjänstepensionsförening'),
    ('bolagsverket_statistics', 'statistics_organization_form', 'TSF', 'Trossamfund som bedriver näringsverksamhet'),
    ('bolagsverket_statistics', 'representative_role', 'AK', 'Aktuarie'),
    ('bolagsverket_statistics', 'representative_role', 'BO', 'Bolagsman'),
    ('bolagsverket_statistics', 'representative_role', 'DELG', 'Särskild delgivningsmottagare'),
    ('bolagsverket_statistics', 'representative_role', 'EFT', 'Extern firmatecknare'),
    ('bolagsverket_statistics', 'representative_role', 'EVD', 'Extern verkställande direktör'),
    ('bolagsverket_statistics', 'representative_role', 'EVVD', 'Extern vice verkställande direktör'),
    ('bolagsverket_statistics', 'representative_role', 'FO', 'Föreståndare'),
    ('bolagsverket_statistics', 'representative_role', 'IN', 'Innehavare'),
    ('bolagsverket_statistics', 'representative_role', 'KD', 'Kommanditdelägare'),
    ('bolagsverket_statistics', 'representative_role', 'KP', 'Komplementär'),
    ('bolagsverket_statistics', 'representative_role', 'LE', 'Styrelseledamot'),
    ('bolagsverket_statistics', 'representative_role', 'LI', 'Likvidator'),
    ('bolagsverket_statistics', 'representative_role', 'LS', 'Likvidatorssuppleant'),
    ('bolagsverket_statistics', 'representative_role', 'OF', 'Ordförande'),
    ('bolagsverket_statistics', 'representative_role', 'PO', 'Prokurist'),
    ('bolagsverket_statistics', 'representative_role', 'REP', 'Representant'),
    ('bolagsverket_statistics', 'representative_role', 'REV', 'Revisor'),
    ('bolagsverket_statistics', 'representative_role', 'REVH', 'Huvudansvarig revisor'),
    ('bolagsverket_statistics', 'representative_role', 'REVL', 'Lekmannarevisor'),
    ('bolagsverket_statistics', 'representative_role', 'REVS', 'Revisorssuppleant'),
    ('bolagsverket_statistics', 'representative_role', 'REVSL', 'Suppleant för lekmannarevisor'),
    ('bolagsverket_statistics', 'representative_role', 'REVST', 'Revisorssuppleant med tillstånd'),
    ('bolagsverket_statistics', 'representative_role', 'REVT', 'Revisor med tillstånd'),
    ('bolagsverket_statistics', 'representative_role', 'SU', 'Suppleant'),
    ('bolagsverket_statistics', 'representative_role', 'SVD', 'Ställföreträdande verkställande direktör'),
    ('bolagsverket_statistics', 'representative_role', 'VD', 'Verkställande direktör'),
    ('bolagsverket_statistics', 'representative_role', 'VLE', 'Verkställande ledamot'),
    ('bolagsverket_statistics', 'representative_role', 'VOF', 'Vice ordförande'),
    ('bolagsverket_statistics', 'representative_role', 'VVD', 'Vice verkställande direktör'),
    ('bolagsverket_statistics', 'formation_type', 'COMPANY', 'Aktiebolag'),
    ('bolagsverket_statistics', 'formation_type', 'SHELF_COMPANY', 'Lagerbolag'),
    ('bolagsverket_statistics', 'representative_gender', 'F', 'Kvinna'),
    ('bolagsverket_statistics', 'representative_gender', 'M', 'Man'),
    ('bolagsverket_statistics', 'representative_gender', 'UNKNOWN', 'Okänt'),
    ('bolagsverket_statistics', 'representative_gender', 'ORG', 'Organisation'),
    ('bolagsverket_statistics', 'representative_age_band', 'UNDER_50', 'Yngre än 50 år'),
    ('bolagsverket_statistics', 'representative_age_band', '50_PLUS', '50 år och äldre'),
    ('bolagsverket_statistics', 'representative_age_band', 'UNKNOWN', 'Okänd'),
    ('bolagsverket_statistics', 'representative_entity_type', 'F', 'Fysisk person'),
    ('bolagsverket_statistics', 'representative_entity_type', 'J', 'Juridisk person'),
    ('bolagsverket_statistics', 'representative_entity_type', 'O', 'Okänd')
ON CONFLICT (source, domain, code) DO UPDATE SET name = excluded.name;

UPDATE meta.source SET name = 'Migrerad historik' WHERE code = 'legacy';

REFRESH MATERIALIZED VIEW mart.bolagsverket_company_statistics_monthly;
REFRESH MATERIALIZED VIEW mart.bolagsverket_representative_statistics_yearly;

DROP SCHEMA IF EXISTS public;
