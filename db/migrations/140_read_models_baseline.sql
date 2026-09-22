-- Baseline 5/5: stable read contracts for the API and de-identified analytics.
-- Keep source aliases out of these views; the app uses the canonical field names.

CREATE VIEW app.company AS
SELECT
    s.company_id,
    s.state_id,
    c.entity_type,
    k.identity_type,
    CASE
        WHEN k.identity_type = 'ORGNR' THEN k.identity_value
        WHEN k.identity_type IN ('PERSON', 'PERSON_SHORT') THEN right(k.identity_value, 10)
        ELSE k.identity_value
    END AS org_nr,
    CASE
        WHEN k.identity_type = 'ORGNR' THEN '16' || k.identity_value
        WHEN k.identity_type = 'PERSON' THEN k.identity_value
        ELSE NULL::text
    END AS pe_org_nr,
    s.company_name,
    s.registered_name,
    s.co_address AS care_of_address,
    s.postal_address,
    s.postal_code,
    s.postal_city,
    s.seat_municipality_code AS municipality_code,
    s.labels->>'seat_municipality_code' AS municipality_name,
    s.seat_county_code AS county_code,
    s.labels->>'seat_county_code' AS county_name,
    s.region_code,
    s.labels->>'region_code' AS region_name,
    s.workplace_count,
    s.employee_size_code,
    s.labels->>'employee_size_code' AS employee_size,
    s.activity_status_code,
    s.labels->>'activity_status_code' AS activity_status,
    s.legal_entity_status_code,
    s.labels->>'legal_entity_status_code' AS legal_entity_status,
    s.tax_registry_status_code,
    s.labels->>'tax_registry_status_code' AS tax_registry_status,
    s.legal_form_code,
    s.labels->>'legal_form_code' AS legal_form,
    s.organization_form_code,
    s.labels->>'organization_form_code' AS organization_form,
    s.advertising_status_code,
    s.labels->>'advertising_status_code' AS advertising_status,
    s.bulk_advertising_status_code,
    s.labels->>'bulk_advertising_status_code' AS bulk_advertising_status,
    s.mail_status_code,
    s.labels->>'mail_status_code' AS mail_status,
    s.start_date,
    s.end_date,
    s.scb_registration_date,
    s.primary_industry_code,
    s.labels->>'primary_industry_code' AS primary_industry_name,
    left(s.primary_industry_code, 2) || '.' || substring(s.primary_industry_code FROM 3) AS primary_industry_code_formatted,
    s.industry_section_code,
    s.labels->>'industry_section_code' AS industry_section_name,
    s.trade_indicator,
    s.turnover_year,
    s.turnover_class_code AS turnover_size_code,
    s.labels->>'turnover_class_code' AS turnover_size,
    s.turnover_detail_class_code AS turnover_financial_size_code,
    s.labels->>'turnover_detail_class_code' AS turnover_financial_size,
    s.ownership_category_code,
    s.labels->>'ownership_category_code' AS ownership_category,
    s.phone,
    s.email,
    s.private_public_code,
    s.labels->>'private_public_code' AS private_public,
    s.employer_status_code,
    s.labels->>'employer_status_code' AS employer_status,
    s.vat_status_code,
    s.labels->>'vat_status_code' AS vat_status,
    s.f_tax_status_code,
    s.labels->>'f_tax_status_code' AS f_tax_status,
    s.company_state_code,
    s.labels->>'company_state_code' AS company_state,
    s.registered_name_count,
    s.sector_code,
    s.labels->>'sector_code' AS sector,
    s.sme_size_code,
    s.labels->>'sme_size_code' AS sme_size,
    s.female_share,
    s.male_share,
    s.owner_country_code,
    s.labels->>'owner_country_code' AS owner_country,
    s.owner_name,
    s.foreign_ownership_code,
    s.labels->>'foreign_ownership_code' AS foreign_ownership,
    s.valid_from AS ingested_at,
    NULL::timestamptz AS scb_updated_at,
    s.provenance
FROM core.company_current s
JOIN core.company c USING (company_id)
JOIN core.company_identifier k USING (company_id);

CREATE VIEW app.company_list AS
SELECT
    s.company_id,
    CASE
        WHEN k.identity_type = 'ORGNR' THEN k.identity_value
        WHEN k.identity_type IN ('PERSON', 'PERSON_SHORT') THEN right(k.identity_value, 10)
        ELSE k.identity_value
    END AS org_nr,
    CASE
        WHEN k.identity_type = 'ORGNR' THEN '16' || k.identity_value
        WHEN k.identity_type = 'PERSON' THEN k.identity_value
        ELSE NULL::text
    END AS pe_org_nr,
    s.state_id,
    s.company_name,
    s.registered_name,
    s.postal_city,
    s.seat_municipality_code AS municipality_code,
    s.labels->>'seat_municipality_code' AS municipality_name,
    s.seat_county_code AS county_code,
    s.labels->>'seat_county_code' AS county_name,
    s.region_code,
    s.labels->>'region_code' AS region_name,
    s.industry_section_code,
    s.labels->>'industry_section_code' AS industry_section_name,
    s.primary_industry_code,
    s.labels->>'primary_industry_code' AS primary_industry_name,
    s.employee_size_code,
    s.labels->>'employee_size_code' AS employee_size,
    s.turnover_class_code AS turnover_size_code,
    s.labels->>'turnover_class_code' AS turnover_size,
    s.turnover_detail_class_code AS turnover_financial_size_code,
    s.labels->>'turnover_detail_class_code' AS turnover_financial_size,
    s.legal_form_code,
    s.labels->>'legal_form_code' AS legal_form,
    s.organization_form_code,
    s.labels->>'organization_form_code' AS organization_form,
    s.sector_code,
    s.labels->>'sector_code' AS sector,
    s.activity_status_code,
    s.labels->>'activity_status_code' AS activity_status,
    s.company_state_code,
    s.labels->>'company_state_code' AS company_state,
    s.employer_status_code,
    s.labels->>'employer_status_code' AS employer_status,
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
FROM core.company_current s
JOIN core.company_identifier k USING (company_id);

CREATE VIEW app.dim_county AS
SELECT DISTINCT ON (code) code, name
FROM meta.code
WHERE domain = 'seat_county_code'
ORDER BY code, CASE source WHEN 'scb_api' THEN 0 WHEN 'scb_bulk' THEN 1 ELSE 2 END;

CREATE VIEW app.dim_municipality AS
SELECT DISTINCT ON (code) code, name, parent_code AS county_code
FROM meta.code
WHERE domain = 'seat_municipality_code'
ORDER BY code, CASE source WHEN 'scb_api' THEN 0 WHEN 'scb_bulk' THEN 1 ELSE 2 END;

CREATE VIEW app.company_change AS
SELECT h.id, h.company_id, c.org_nr, h.field_name, h.old_value, h.new_value,
       h.old_label, h.new_label, h.detected_at, h.ingestion_run_id, h.importance
FROM core.company_change h
JOIN app.company c USING (company_id);

CREATE VIEW app.company_history AS
SELECT * FROM core.company_state_history;

CREATE VIEW app.business_event AS
SELECT e.id, e.company_id, e.event_type, e.title, e.description, e.effective_at,
       e.detected_at, e.ingestion_run_id, e.company_change_ids, e.importance, c.org_nr
FROM core.company_event e
JOIN app.company c USING (company_id);

CREATE VIEW app.ingestion_run AS
SELECT * FROM meta.ingestion_run;

CREATE VIEW app.company_source_details AS
SELECT company_id, source, source_key, source_subkey, data, valid_from, last_ingestion_run_id
FROM src_scb.company_history
WHERE valid_to IS NULL
UNION ALL
SELECT company_id, source, source_key, source_subkey, data, valid_from, last_ingestion_run_id
FROM src_bolagsverket.organization_current;

-- Older observations may keep business_description at the payload root. The
-- current importer puts it in _registration; this fallback makes both readable.
CREATE VIEW app.company_registration AS
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
    h.data->'_names' AS names,
    h.data->'_procedures' AS procedures,
    h.valid_from,
    h.last_ingestion_run_id
FROM src_bolagsverket.organization_current h;

CREATE VIEW app.workplace AS
SELECT w.company_id, w.cfar_number, s.*
FROM core.workplace w
JOIN core.workplace_current s USING (workplace_id);

-- Analytics omit personal identifiers and free text. No snapshot copies are
-- created until a measured reporting workload requires materialization.
CREATE VIEW mart.company_current AS
SELECT company_id, activity_status_code, legal_form_code, primary_industry_code,
       seat_county_code, seat_municipality_code, employee_size_code, turnover_class_code,
       workplace_count, valid_from
FROM core.company_current;

CREATE VIEW mart.company_state_history AS
SELECT company_id, activity_status_code, legal_form_code, primary_industry_code,
       seat_county_code, seat_municipality_code, employee_size_code, turnover_class_code,
       workplace_count, valid_from, valid_to
FROM core.company_state_history;
