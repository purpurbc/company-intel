-- Versioned aggregate statistics from Bolagsverket's four monthly CSV files.
--
-- Import flow:
-- 1. Every decoded source row is archived immutably in raw.statistics_record.
-- 2. Parsed rows are staged by ingestion run so an interrupted file can resume.
-- 3. A complete snapshot is merged atomically into statistics_history.
-- 4. Changed rows get a new SCD2 version; missing keys are closed, never deleted.
-- 5. App views expose typed current facts. Mart views unpivot wide source metrics.

INSERT INTO meta.source(code, name)
VALUES ('bolagsverket_statistics', 'Bolagsverkets öppna statistik')
ON CONFLICT (code) DO UPDATE SET name = excluded.name;

ALTER TABLE meta.ingestion_run
    ADD CONSTRAINT ingestion_run_dataset_identity UNIQUE (dataset, id);
CREATE INDEX ingestion_run_dataset_file
    ON meta.ingestion_run(source, dataset, file_checksum, id DESC);

CREATE TABLE raw.statistics_record (
    dataset text NOT NULL,
    ingestion_run_id bigint NOT NULL,
    row_number bigint NOT NULL CHECK (row_number > 1),
    source_file text,
    payload json NOT NULL,
    raw_hash text NOT NULL CHECK (raw_hash ~ '^[0-9a-f]{64}$'),
    observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (dataset, ingestion_run_id, row_number),
    FOREIGN KEY (dataset, ingestion_run_id)
        REFERENCES meta.ingestion_run(dataset, id)
) PARTITION BY LIST (dataset);
CREATE TABLE raw.bolagsverket_company_statistics
    PARTITION OF raw.statistics_record FOR VALUES IN ('companies');
CREATE TABLE raw.bolagsverket_representative_statistics
    PARTITION OF raw.statistics_record FOR VALUES IN ('representatives');
CREATE TABLE raw.bolagsverket_auditor_reservation_statistics
    PARTITION OF raw.statistics_record FOR VALUES IN ('auditor_reservations');
CREATE TABLE raw.bolagsverket_filing_delay_statistics
    PARTITION OF raw.statistics_record FOR VALUES IN ('filing_delays');
CREATE TRIGGER immutable_statistics_record
    BEFORE UPDATE OR DELETE ON raw.statistics_record
    FOR EACH ROW EXECUTE FUNCTION raw.reject_mutation();

-- This durable stage is intentionally separate from raw. Raw preserves the
-- decoded source, while the stage contains canonical keys and typed JSON values
-- needed to finish or resume one all-file snapshot merge.
CREATE TABLE src_bolagsverket.statistics_import_stage (
    ingestion_run_id bigint NOT NULL,
    dataset text NOT NULL,
    row_number bigint NOT NULL CHECK (row_number > 1),
    natural_key jsonb NOT NULL CHECK (jsonb_typeof(natural_key) = 'object'),
    natural_key_hash text NOT NULL CHECK (natural_key_hash ~ '^[0-9a-f]{64}$'),
    data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
    row_hash text NOT NULL CHECK (row_hash ~ '^[0-9a-f]{64}$'),
    PRIMARY KEY (dataset, ingestion_run_id, row_number),
    UNIQUE (dataset, ingestion_run_id, natural_key_hash),
    FOREIGN KEY (dataset, ingestion_run_id)
        REFERENCES meta.ingestion_run(dataset, id)
);

CREATE TABLE src_bolagsverket.statistics_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dataset text NOT NULL,
    natural_key jsonb NOT NULL CHECK (jsonb_typeof(natural_key) = 'object'),
    natural_key_hash text NOT NULL CHECK (natural_key_hash ~ '^[0-9a-f]{64}$'),
    data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
    row_hash text NOT NULL CHECK (row_hash ~ '^[0-9a-f]{64}$'),
    valid_from timestamptz NOT NULL,
    valid_to timestamptz,
    first_ingestion_run_id bigint NOT NULL REFERENCES meta.ingestion_run(id),
    last_ingestion_run_id bigint NOT NULL REFERENCES meta.ingestion_run(id),
    first_row_number bigint NOT NULL,
    last_row_number bigint NOT NULL,
    CHECK (valid_to IS NULL OR valid_to > valid_from),
    FOREIGN KEY (dataset, first_ingestion_run_id, first_row_number)
        REFERENCES raw.statistics_record(dataset, ingestion_run_id, row_number),
    FOREIGN KEY (dataset, last_ingestion_run_id, last_row_number)
        REFERENCES raw.statistics_record(dataset, ingestion_run_id, row_number)
);
CREATE UNIQUE INDEX statistics_current_key
    ON src_bolagsverket.statistics_history(dataset, natural_key_hash)
    WHERE valid_to IS NULL;
CREATE INDEX statistics_versions
    ON src_bolagsverket.statistics_history(
        dataset, natural_key_hash, valid_from DESC
    );
CREATE INDEX statistics_current_company_period
    ON src_bolagsverket.statistics_history(
        (data->>'period_start'),
        (data->>'event_code'),
        (data->>'county_code'),
        (data->>'municipality_code')
    )
    WHERE dataset = 'companies' AND valid_to IS NULL;
CREATE INDEX statistics_current_representative_dimensions
    ON src_bolagsverket.statistics_history(
        (data->>'year'),
        (data->>'organization_form_code'),
        (data->>'county_code'),
        (data->>'municipality_code')
    )
    WHERE dataset = 'representatives' AND valid_to IS NULL;
CREATE INDEX statistics_current_auditor_year
    ON src_bolagsverket.statistics_history((data->>'registration_year'))
    WHERE dataset = 'auditor_reservations' AND valid_to IS NULL;
CREATE INDEX statistics_current_filing_year
    ON src_bolagsverket.statistics_history((data->>'period_through_year'))
    WHERE dataset = 'filing_delays' AND valid_to IS NULL;

CREATE VIEW src_bolagsverket.statistics_current AS
SELECT *
FROM src_bolagsverket.statistics_history
WHERE valid_to IS NULL;

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

CREATE VIEW app.dim_bolagsverket_statistics_event AS
SELECT code::smallint AS code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics' AND domain = 'statistics_event';

CREATE VIEW app.dim_bolagsverket_statistics_organization_form AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics'
  AND domain = 'statistics_organization_form';

CREATE VIEW app.dim_bolagsverket_representative_role AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics' AND domain = 'representative_role';

CREATE VIEW app.dim_bolagsverket_formation_type AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics' AND domain = 'formation_type';

CREATE VIEW app.dim_bolagsverket_representative_gender AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics' AND domain = 'representative_gender';

CREATE VIEW app.dim_bolagsverket_representative_age_band AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics' AND domain = 'representative_age_band';

CREATE VIEW app.dim_bolagsverket_representative_entity_type AS
SELECT code, name
FROM meta.code
WHERE source = 'bolagsverket_statistics'
  AND domain = 'representative_entity_type';

CREATE VIEW app.dim_bolagsverket_region_family AS
SELECT DISTINCT ON (fact.region_family_code)
    fact.region_family_code AS code,
    fact.region_family_name AS name
FROM src_bolagsverket.statistics_current history
CROSS JOIN LATERAL jsonb_to_record(history.data) AS fact(
    region_family_code text,
    region_family_name text
)
WHERE history.dataset = 'companies'
  AND fact.region_family_code IS NOT NULL
ORDER BY fact.region_family_code, history.valid_from DESC;

CREATE VIEW app.bolagsverket_company_statistics AS
SELECT
    history.id AS statistics_version_id,
    fact.*,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
FROM src_bolagsverket.statistics_current history
CROSS JOIN LATERAL jsonb_to_record(history.data) AS fact(
    period_start date,
    event_code smallint,
    region_family_code text,
    region_family_name text,
    source_county_code text,
    source_municipality_code text,
    county_code text,
    municipality_code text,
    county_name text,
    municipality_name text,
    source_loaded_at timestamp without time zone,
    count_ab bigint,
    count_bab bigint,
    count_bf bigint,
    count_brf bigint,
    count_ek bigint,
    count_e bigint,
    count_se bigint,
    count_fl bigint,
    count_fab bigint,
    count_hb bigint,
    count_i bigint,
    count_kb bigint,
    count_khf bigint,
    count_mb bigint,
    count_sf bigint,
    count_sb bigint,
    count_tsf bigint,
    count_bfl bigint,
    count_ofb bigint,
    count_sce bigint,
    count_s bigint,
    count_egts bigint,
    count_fof bigint,
    count_tpab bigint,
    count_otpb bigint,
    count_tpf bigint
)
WHERE history.dataset = 'companies';

CREATE VIEW app.bolagsverket_representative_statistics AS
SELECT
    history.id AS statistics_version_id,
    fact.*,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
FROM src_bolagsverket.statistics_current history
CROSS JOIN LATERAL jsonb_to_record(history.data) AS fact(
    year smallint,
    organization_form_code text,
    county_code text,
    municipality_code text,
    county_name text,
    municipality_name text,
    private_public_code text,
    is_employee_representative boolean,
    is_foreign_resident boolean,
    is_resident_in_ees boolean,
    gender_code text,
    age_band_code text,
    representative_entity_type_code text,
    has_coordination_number boolean,
    count_ak bigint,
    count_bo bigint,
    count_delg bigint,
    count_eft bigint,
    count_evd bigint,
    count_evvd bigint,
    count_fo bigint,
    count_in bigint,
    count_kd bigint,
    count_kp bigint,
    count_le bigint,
    count_li bigint,
    count_ls bigint,
    count_of bigint,
    count_po bigint,
    count_rep bigint,
    count_rev bigint,
    count_revh bigint,
    count_revl bigint,
    count_revs bigint,
    count_revsl bigint,
    count_revst bigint,
    count_revt bigint,
    count_su bigint,
    count_svd bigint,
    count_vd bigint,
    count_vle bigint,
    count_vof bigint,
    count_vvd bigint
)
WHERE history.dataset = 'representatives';

CREATE VIEW app.bolagsverket_auditor_reservation_statistics AS
SELECT
    history.id AS statistics_version_id,
    fact.*,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
FROM src_bolagsverket.statistics_current history
CROSS JOIN LATERAL jsonb_to_record(history.data) AS fact(
    registration_year smallint,
    formation_type_code text,
    company_count bigint,
    with_auditor_at_formation_count bigint,
    with_auditor_reservation_count bigint,
    without_auditor_with_reservation_count bigint,
    with_auditor_reservation_share numeric,
    without_auditor_with_reservation_share numeric
)
WHERE history.dataset = 'auditor_reservations';

CREATE VIEW app.bolagsverket_filing_delay_statistics AS
SELECT
    history.id AS statistics_version_id,
    fact.*,
    history.valid_from AS observed_from,
    history.first_ingestion_run_id,
    history.last_ingestion_run_id,
    history.last_row_number AS source_row_number
FROM src_bolagsverket.statistics_current history
CROSS JOIN LATERAL jsonb_to_record(history.data) AS fact(
    period_through_year smallint,
    accounting_period_group text,
    county_code text,
    county_name text,
    expected_to_file_count bigint,
    late_fee_count bigint,
    filed_annual_report_count bigint,
    filed_annual_report_share numeric,
    late_fee_share numeric
)
WHERE history.dataset = 'filing_delays';

-- The wide app views mirror each source row. These mart views expose the two
-- repeated measure groups at their useful analytical grain.
CREATE VIEW mart.bolagsverket_company_statistics_by_form AS
SELECT
    statistics.period_start,
    statistics.event_code,
    event.name AS event_name,
    statistics.region_family_code,
    statistics.county_code,
    statistics.municipality_code,
    form.organization_form_code,
    dimension.name AS organization_form_name,
    form.company_count,
    statistics.observed_from
FROM app.bolagsverket_company_statistics statistics
LEFT JOIN app.dim_bolagsverket_statistics_event event
    ON event.code = statistics.event_code
CROSS JOIN LATERAL (VALUES
    ('AB', statistics.count_ab),
    ('BAB', statistics.count_bab),
    ('BF', statistics.count_bf),
    ('BRF', statistics.count_brf),
    ('EK', statistics.count_ek),
    ('E', statistics.count_e),
    ('SE', statistics.count_se),
    ('FL', statistics.count_fl),
    ('FAB', statistics.count_fab),
    ('HB', statistics.count_hb),
    ('I', statistics.count_i),
    ('KB', statistics.count_kb),
    ('KHF', statistics.count_khf),
    ('MB', statistics.count_mb),
    ('SF', statistics.count_sf),
    ('SB', statistics.count_sb),
    ('TSF', statistics.count_tsf),
    ('BFL', statistics.count_bfl),
    ('OFB', statistics.count_ofb),
    ('SCE', statistics.count_sce),
    ('S', statistics.count_s),
    ('EGTS', statistics.count_egts),
    ('FOF', statistics.count_fof),
    ('TPAB', statistics.count_tpab),
    ('OTPB', statistics.count_otpb),
    ('TPF', statistics.count_tpf)
) AS form(organization_form_code, company_count)
LEFT JOIN app.dim_bolagsverket_statistics_organization_form dimension
    ON dimension.code = form.organization_form_code
WHERE form.company_count IS NOT NULL;

CREATE VIEW mart.bolagsverket_representative_statistics_by_role AS
SELECT
    statistics.year,
    statistics.organization_form_code,
    statistics.county_code,
    statistics.municipality_code,
    statistics.private_public_code,
    statistics.is_employee_representative,
    statistics.is_foreign_resident,
    statistics.is_resident_in_ees,
    statistics.gender_code,
    statistics.age_band_code,
    statistics.representative_entity_type_code,
    statistics.has_coordination_number,
    role.representative_role_code,
    dimension.name AS representative_role_name,
    role.representative_count,
    statistics.observed_from
FROM app.bolagsverket_representative_statistics statistics
CROSS JOIN LATERAL (VALUES
    ('AK', statistics.count_ak),
    ('BO', statistics.count_bo),
    ('DELG', statistics.count_delg),
    ('EFT', statistics.count_eft),
    ('EVD', statistics.count_evd),
    ('EVVD', statistics.count_evvd),
    ('FO', statistics.count_fo),
    ('IN', statistics.count_in),
    ('KD', statistics.count_kd),
    ('KP', statistics.count_kp),
    ('LE', statistics.count_le),
    ('LI', statistics.count_li),
    ('LS', statistics.count_ls),
    ('OF', statistics.count_of),
    ('PO', statistics.count_po),
    ('REP', statistics.count_rep),
    ('REV', statistics.count_rev),
    ('REVH', statistics.count_revh),
    ('REVL', statistics.count_revl),
    ('REVS', statistics.count_revs),
    ('REVSL', statistics.count_revsl),
    ('REVST', statistics.count_revst),
    ('REVT', statistics.count_revt),
    ('SU', statistics.count_su),
    ('SVD', statistics.count_svd),
    ('VD', statistics.count_vd),
    ('VLE', statistics.count_vle),
    ('VOF', statistics.count_vof),
    ('VVD', statistics.count_vvd)
) AS role(representative_role_code, representative_count)
LEFT JOIN app.dim_bolagsverket_representative_role dimension
    ON dimension.code = role.representative_role_code
WHERE role.representative_count <> 0;

CREATE VIEW mart.bolagsverket_auditor_reservation_statistics AS
SELECT * FROM app.bolagsverket_auditor_reservation_statistics;

CREATE VIEW mart.bolagsverket_filing_delay_statistics AS
SELECT * FROM app.bolagsverket_filing_delay_statistics;
