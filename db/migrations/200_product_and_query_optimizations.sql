-- Consolidated post-baseline product and query optimizations.
-- Historical databases that applied the former 200-290 chain adopt this file
-- through db.migrate; new databases execute it once after the five baselines.

-- Formerly 200_company_metric_sort_indexes.sql
-- Fast first-page and paginated sorts across the complete current company set.
-- The API pages state_ids through these compact indexes before joining wide views.

CREATE INDEX company_current_turnover_sort_asc
ON core.company_state_history (
    (turnover_class_code::integer) ASC NULLS LAST,
    company_name ASC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_turnover_sort_desc
ON core.company_state_history (
    (turnover_class_code::integer) DESC NULLS LAST,
    company_name ASC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_employee_sort_asc
ON core.company_state_history (
    (employee_size_code::integer) ASC NULLS LAST,
    company_name ASC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_employee_sort_desc
ON core.company_state_history (
    (employee_size_code::integer) DESC NULLS LAST,
    company_name ASC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

-- Formerly 210_company_metric_name_desc_indexes.sql
-- Companion indexes for metric sorts using reverse alphabetical tie-breaking.
-- Reversing an ASC-name index also reverses the metric/null order, so these
-- explicit variants keep NULLS LAST and make later pages predictable.

CREATE INDEX company_current_turnover_sort_asc_name_desc
ON core.company_state_history (
    (turnover_class_code::integer) ASC NULLS LAST,
    company_name DESC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_turnover_sort_desc_name_desc
ON core.company_state_history (
    (turnover_class_code::integer) DESC NULLS LAST,
    company_name DESC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_employee_sort_asc_name_desc
ON core.company_state_history (
    (employee_size_code::integer) ASC NULLS LAST,
    company_name DESC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

CREATE INDEX company_current_employee_sort_desc_name_desc
ON core.company_state_history (
    (employee_size_code::integer) DESC NULLS LAST,
    company_name DESC NULLS LAST,
    company_id
)
WHERE valid_to IS NULL;

-- Formerly 220_search_observability.sql
-- Privacy-preserving search telemetry. Query text and identifiers are never
-- stored; the table keeps only performance, search-shape and interaction data.

CREATE TABLE app.search_event (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    search_id uuid NOT NULL,
    observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    event_type text NOT NULL CHECK (event_type IN ('data', 'count', 'click')),
    outcome text NOT NULL CHECK (outcome IN ('ok', 'timeout', 'error')),
    duration_ms numeric(12, 2) CHECK (duration_ms IS NULL OR duration_ms >= 0),
    search_mode text CHECK (search_mode IN ('results', 'autocomplete')),
    scope text CHECK (scope IN ('lead_ready', 'all')),
    query_length smallint CHECK (query_length IS NULL OR query_length >= 0),
    search_by text CHECK (search_by IN ('all', 'company_name', 'org_nr')),
    fuzzy_used boolean,
    filter_count smallint CHECK (filter_count IS NULL OR filter_count >= 0),
    filter_keys text[] NOT NULL DEFAULT '{}',
    result_count integer CHECK (result_count IS NULL OR result_count >= 0),
    total_value bigint CHECK (total_value IS NULL OR total_value >= 0),
    total_kind text CHECK (total_kind IN ('exact', 'estimated', 'none')),
    reformulated boolean NOT NULL DEFAULT false,
    company_id bigint REFERENCES core.company(company_id),
    click_position integer CHECK (click_position IS NULL OR click_position >= 1)
);

CREATE INDEX search_event_observed_at
ON app.search_event(observed_at DESC);

CREATE INDEX search_event_search_id
ON app.search_event(search_id, observed_at);

-- Formerly 230_company_registration_date_index.sql
-- Company age is a range over the best available full registration/start date.
-- This partial expression index supports that range without scanning all history.
CREATE INDEX company_current_registration_date
ON core.company_state_history (
    (COALESCE(start_date, scb_registration_date)),
    company_id
)
WHERE valid_to IS NULL;

-- Formerly 240_company_watch_and_search_scope_cleanup.sql
-- Searches no longer have a hidden/default scope. Keep telemetry focused on
-- the actual query and filters, and add the explicit company watch action.
ALTER TABLE app.search_event DROP COLUMN IF EXISTS scope;

CREATE TABLE app.watched_company (
    user_id uuid NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    company_id bigint NOT NULL REFERENCES core.company(company_id) ON DELETE CASCADE,
    watched_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, company_id)
);

CREATE INDEX watched_company_user_time
ON app.watched_company(user_id, watched_at DESC);

-- Formerly 250_company_combined_name_search.sql
-- Count exact text matches once per current company instead of unioning and
-- deduplicating the displayed and registered name indexes at query time.
CREATE INDEX company_current_combined_name_tokens
ON core.company_state_history USING gin (
    to_tsvector(
        'simple',
        coalesce(company_name, '') || ' ' || coalesce(registered_name, '')
    )
)
WHERE valid_to IS NULL;

-- Formerly 260_organization_current_name_lookup.sql
-- Alias searches start from the GIN name index and then resolve the owning
-- current organization. Cover that lookup without visiting history heap rows.
CREATE INDEX organization_history_current_name_lookup
ON src_bolagsverket.organization_history (id)
INCLUDE (company_id)
WHERE valid_to IS NULL;

-- Formerly 270_company_filter_planner_support.sql
-- Planner support for the filters exposed by GET /companies.
--
-- These are canonical code columns on the current company state, not lookup
-- dimensions. Separate dimension tables would improve labels and governance,
-- but would not speed these predicates. Partial B-tree indexes let PostgreSQL
-- combine selective filters with the existing GIN/trigram search indexes.

CREATE INDEX company_current_company_state
ON core.company_state_history (company_state_code)
WHERE valid_to IS NULL AND company_state_code IS NOT NULL;

CREATE INDEX company_current_employer_status
ON core.company_state_history (employer_status_code)
WHERE valid_to IS NULL AND employer_status_code IS NOT NULL;

CREATE INDEX company_current_vat_status
ON core.company_state_history (vat_status_code)
WHERE valid_to IS NULL AND vat_status_code IS NOT NULL;

CREATE INDEX company_current_f_tax_status
ON core.company_state_history (f_tax_status_code)
WHERE valid_to IS NULL AND f_tax_status_code IS NOT NULL;

CREATE INDEX company_current_advertising_status
ON core.company_state_history (advertising_status_code)
WHERE valid_to IS NULL AND advertising_status_code IS NOT NULL;

CREATE INDEX company_current_industry_section
ON core.company_state_history (industry_section_code)
WHERE valid_to IS NULL AND industry_section_code IS NOT NULL;

CREATE INDEX company_current_ownership_category
ON core.company_state_history (ownership_category_code)
WHERE valid_to IS NULL AND ownership_category_code IS NOT NULL;

CREATE INDEX company_current_sme_size
ON core.company_state_history (sme_size_code)
WHERE valid_to IS NULL AND sme_size_code IS NOT NULL;

CREATE INDEX company_current_trade_indicator
ON core.company_state_history (trade_indicator)
WHERE valid_to IS NULL AND trade_indicator IS NOT NULL;

-- Geography and registry flags are correlated. Extended statistics prevent
-- the planner from multiplying independent estimates and choosing a poor join
-- order for real-world filter combinations.
CREATE STATISTICS company_current_geography_filter_stats (dependencies, mcv)
ON seat_county_code, seat_municipality_code, activity_status_code,
   industry_section_code
FROM core.company_state_history;

CREATE STATISTICS company_current_registry_filter_stats (dependencies, mcv)
ON activity_status_code, company_state_code, employer_status_code,
   vat_status_code, f_tax_status_code
FROM core.company_state_history;

ALTER TABLE core.company_state_history
    ALTER COLUMN seat_county_code SET STATISTICS 500,
    ALTER COLUMN seat_municipality_code SET STATISTICS 500,
    ALTER COLUMN activity_status_code SET STATISTICS 500,
    ALTER COLUMN company_state_code SET STATISTICS 500,
    ALTER COLUMN employer_status_code SET STATISTICS 500,
    ALTER COLUMN vat_status_code SET STATISTICS 500,
    ALTER COLUMN f_tax_status_code SET STATISTICS 500,
    ALTER COLUMN industry_section_code SET STATISTICS 500;

ANALYZE core.company_state_history (
    seat_county_code,
    seat_municipality_code,
    activity_status_code,
    company_state_code,
    employer_status_code,
    vat_status_code,
    f_tax_status_code,
    industry_section_code
);

-- Formerly 280_company_current_search_scope_lookup.sql
-- Alias matches resolve back to the current company before filters and sorting.
-- The history heap is large, so a company_id lookup that needs filter columns
-- otherwise becomes one random heap read per alias candidate. This covering
-- partial index keeps that join index-only without duplicating wide API data.

CREATE INDEX company_current_search_scope_lookup
ON core.company_state_history (company_id)
INCLUDE (
    state_id,
    company_name,
    seat_county_code,
    seat_municipality_code,
    activity_status_code,
    company_state_code,
    employer_status_code,
    vat_status_code,
    f_tax_status_code,
    advertising_status_code,
    employee_size_code,
    start_date,
    scb_registration_date,
    postal_city,
    postal_code,
    ownership_category_code,
    sme_size_code,
    trade_indicator,
    industry_section_code,
    primary_industry_code,
    turnover_class_code
)
WHERE valid_to IS NULL;

ANALYZE src_bolagsverket.organization_name;
ANALYZE src_bolagsverket.organization_history;

-- Formerly 290_regional_overview_indexes.sql
-- Regional overview pages aggregate the same current-state code columns for
-- every breakdown. Keep those reads index-only and make code-label lookups
-- start from their actual predicates (domain + code), not source.

CREATE INDEX company_current_regional_overview
ON core.company_state_history (seat_county_code, seat_municipality_code)
INCLUDE (
    region_code,
    primary_industry_code,
    employee_size_code,
    turnover_class_code,
    activity_status_code,
    employer_status_code,
    company_state_code
)
WHERE valid_to IS NULL;

CREATE INDEX code_domain_lookup
ON meta.code (domain, code, source)
INCLUDE (name, parent_code);

ANALYZE core.company_state_history;
ANALYZE meta.code;


