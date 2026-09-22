// ============================================================
// Shared types for Company Intel
// Mirrors the app-facing FastAPI contract. Source-specific names from SCB and
// Bolagsverket stay in the worker/import boundary.
// ============================================================

// ------------------------------------------------------------
// Pagination envelope — used by both list endpoints
// ------------------------------------------------------------
export type PaginatedResponse<T> = {
  items: T[];
  total?: number;    // may be omitted if count is expensive
  limit: number;
  offset: number;
};

// ------------------------------------------------------------
// Company (Företag / Je)
// ------------------------------------------------------------

export type CompanySearchBy =
  | "all"
  | "company_name"
  | "org_nr";

export type CompanyNameSort = "asc" | "desc";

export type CompanyMetricSort =
  | "none"
  | "turnover_asc"
  | "turnover_desc"
  | "size_asc"
  | "size_desc";

export type ListCompaniesParams = {
  q?: string;
  search_by?: CompanySearchBy;

  county_codes?: string[];
  municipality_codes?: string[];
  company_status_codes?: string[];
  company_state_codes?: string[];
  employer_status_codes?: string[];
  vat_status_codes?: string[];
  f_tax_status_codes?: string[];
  marketing_status_codes?: string[];
  size_class_codes?: string[];
  age_min?: number;
  age_max?: number;
  post_ort?: string;
  post_nr?: string;
  owner_category_codes?: string[];
  sme_size_codes?: string[];
  export_import_marks?: string[];
  section_codes?: string[];
  industry_codes?: string[];
  industry_detail_codes?: string[];
  turnover_size_codes?: string[];

  name_sort?: CompanyNameSort;
  metric_sort?: CompanyMetricSort;
  limit?: number;
  offset?: number;
  include_total?: boolean;
  count_only?: boolean;
  search_id?: string;
  reformulated?: boolean;
};

/** Lightweight shape returned by GET /companies (list view) */
export type CompanyListItem = {
  company_id: number;
  entity_type: "organization" | "person" | "other";
  org_nr: string;
  pe_org_nr: string | null;
  company_name: string | null;
  registered_name: string | null;
  matched_name: string | null;
  care_of_address: string | null;
  postal_address: string | null;
  postal_code: string | null;
  postal_city: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  county_code: string | null;
  county_name: string | null;
  region_code: string | null;
  region_name: string | null;
  primary_industry_code: string | null;
  primary_industry_name: string | null;
  industry_section_code: string | null;
  industry_section_name: string | null;
  employee_size_code: string | null;
  employee_size: string | null;
  turnover_size_code: string | null;
  turnover_size: string | null;
  turnover_financial_size_code: string | null;
  turnover_financial_size: string | null;
  organization_form_code: string | null;
  organization_form: string | null;
  activity_status_code: string | null;
  activity_status: string | null;
  company_state_code: string | null;
  company_state: string | null;
  employer_status_code: string | null;
  employer_status: string | null;
};

/** Full shape returned by GET /company/:org_nr (detail view) */
export type Company = {
  company_id: number;
  state_id: number;
  entity_type: "organization" | "person" | "other";
  identity_type: string;
  org_nr: string;
  pe_org_nr: string | null;
  company_name: string | null;
  registered_name: string | null;
  care_of_address: string | null;
  postal_address: string | null;
  postal_code: string | null;
  postal_city: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  county_code: string | null;
  county_name: string | null;
  region_code: string | null;
  region_name: string | null;
  workplace_count: number | null;
  employee_size_code: string | null;
  employee_size: string | null;
  activity_status_code: string | null;
  activity_status: string | null;
  legal_entity_status_code: string | null;
  legal_entity_status: string | null;
  tax_registry_status_code: string | null;
  tax_registry_status: string | null;
  legal_form_code: string | null;
  legal_form: string | null;
  organization_form_code: string | null;
  organization_form: string | null;
  advertising_status_code: string | null;
  advertising_status: string | null;
  bulk_advertising_status_code: string | null;
  bulk_advertising_status: string | null;
  mail_status_code: string | null;
  mail_status: string | null;
  start_date: string | null;
  end_date: string | null;
  scb_registration_date: string | null;
  bolagsverket_registration_date: string | null;
  bolagsverket_registration_active: boolean | null;
  registered_name_date: string | null;
  business_description: string | null;
  primary_industry_code: string | null;
  primary_industry_name: string | null;
  primary_industry_code_formatted: string | null;
  industry_section_code: string | null;
  industry_section_name: string | null;
  trade_indicator: string | null;
  turnover_year: number | null;
  turnover_size_code: string | null;
  turnover_size: string | null;
  turnover_financial_size_code: string | null;
  turnover_financial_size: string | null;
  ownership_category_code: string | null;
  ownership_category: string | null;
  phone: string | null;
  email: string | null;
  private_public_code: string | null;
  private_public: string | null;
  employer_status_code: string | null;
  employer_status: string | null;
  vat_status_code: string | null;
  vat_status: string | null;
  f_tax_status_code: string | null;
  f_tax_status: string | null;
  company_state_code: string | null;
  company_state: string | null;
  registered_name_count: number | null;
  sector_code: string | null;
  sector: string | null;
  sme_size_code: string | null;
  sme_size: string | null;
  female_share?: number | null;
  male_share?: number | null;
  owner_country_code: string | null;
  owner_country: string | null;
  owner_name: string | null;
  foreign_ownership_code: string | null;
  foreign_ownership: string | null;
  ingested_at: string;
  scb_updated_at: string | null;
  registrations: CompanyRegistration[];
  industries: CompanyIndustry[];
  provenance: Record<string, { source: string; version_id: number }>;
};

export type CompaniesResponse = PaginatedResponse<CompanyListItem> & {
  total_kind: "exact" | "estimated" | "none";
  search_mode: "results" | "autocomplete";
  has_more: boolean;
  result_window_limit: number;
};

export type CompanyTurnoverHistoryItem = {
  year: number;
  turnover_size_code: string | null;
  turnover_size: string | null;
  turnover_financial_size_code: string | null;
  turnover_financial_size: string | null;
  source: "current" | "history";
};

export type CompanyEventHistoryItem = {
  id: string;
  kind:
    | "company_event"
    | "change"
    | "registration"
    | "procedure";
  title: string;
  description: string | null;
  effective_at: string | null;
  detected_at: string | null;
  source: string | null;
  source_label: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  old_label: string | null;
  new_label: string | null;
  importance: number;
};

export type CompanyEventHistoryResponse = {
  items: CompanyEventHistoryItem[];
};

export type CompanyIndustry = {
  rank: number;
  sni_code: string;
  sni_version: string;
  source: string;
};

export type CompanyRegistration = {
  company_id: number;
  registration_version_id: number;
  source_key: string;
  source_subkey: string;
  registration: {
    identity_type: string;
    identity_value: string;
    name_protection_sequence: string;
    organization_form_code: string | null;
    registered_on: string | null;
    deregistered_on: string | null;
    deregistration_reason_code: string | null;
    business_description: string | null;
    postal_address: string | null;
    postal_code: string | null;
    postal_city: string | null;
  };
  names: Array<{ name: string; name_type_code: string | null; registered_on: string | null; business_description: string | null }>;
  procedures: Array<{ procedure_code: string | null; procedure_text: string | null; started_on: string | null }>;
};

export type CompanyTurnoverHistoryResponse = {
  items: CompanyTurnoverHistoryItem[];
};

// ------------------------------------------------------------
// Workplace (Arbetsställe / Ae)
// ------------------------------------------------------------

/** Lightweight shape returned by GET /workplaces (list view) */
export type WorkplaceListItem = {
  workplace_id: string;
  workplace_name: string | null;
  org_nr: string | null;           // owning company
  company_name: string | null;
  postal_city: string | null;
  municipality_name: string | null;
  county_name: string | null;
  primary_industry_name: string | null;
};

/** Full shape returned by GET /workplace/:workplace_id (detail view) */
export type Workplace = {
  // --- Identity ---
  workplace_id: string;
  workplace_name: string | null;

  // --- Owning company ---
  org_nr: string | null;
  company_name: string | null;

  // --- Location ---
  postal_city: string | null;
  postal_address: string | null;
  county_name: string | null;
  municipality_name: string | null;

  // --- Industry / classification ---
  primary_industry_code: string | null;
  primary_industry_name: string | null;

  // --- Size ---
  employee_size: string | null;

  // --- Status ---
  workplace_status: string | null;

  [key: string]: unknown;
};

export type WorkplacesResponse = PaginatedResponse<WorkplaceListItem>;

// ------------------------------------------------------------
// County overview (Län)
// ------------------------------------------------------------

export type CountByName = {
  code: string | null;
  name: string | null;
  count: number;
};

export type MetricCoverage = {
  covered: number;
  total: number;
  percent: number | null;
};

export type OverviewMetadata = {
  data_as_of: string | null;
  source: string;
  last_successful_import_at: string | null;
  timezone: "Europe/Stockholm";
  coverage: Record<string, MetricCoverage>;
  technical_geography: Record<string, number>;
};

export type CountyOverview = {
  county_code: string;
  county_name: string;

  totals: {
    companies: number;
    active: number;
    employers: number;
    municipalities: number;
    aregions: number;
  };
  metadata: OverviewMetadata;

  by_municipality: CountByName[];
  by_aregion: CountByName[];
  by_industry: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
  by_activity_status: CountByName[];
  by_company_state: CountByName[];
};

// ------------------------------------------------------------
// Municipality overview (Kommun)
// ------------------------------------------------------------

export type MunicipalityOverview = {
  municipality_code: string;
  municipality_name: string;
  county_code: string;
  county_name: string;

  totals: {
    companies: number;
    active: number;
    employers: number;
    aregions: number;
    industries: number;
  };
  metadata: OverviewMetadata;

  by_industry: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
  by_aregion: CountByName[];
  by_activity_status: CountByName[];
  by_company_state: CountByName[];
};

// ------------------------------------------------------------
// Sweden overview
// ------------------------------------------------------------

export type SwedenOverview = {
  scope: "sweden";

  totals: {
    companies: number;
    active: number;
    inactive: number;
    never_active: number;
    employers: number;
    vat_registered: number;
    f_tax_registered: number;
    vat_and_f_tax: number;
    accepts_marketing: number;
    counties: number;
    municipalities: number;
    industry_groups: number;
  };
  metadata: OverviewMetadata;

  by_county: CountByName[];
  by_municipality: CountByName[];
  by_industry: CountByName[];
  by_section: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
  by_activity_status: CountByName[];
  by_company_state: CountByName[];
  by_employer_status: CountByName[];
  by_vat_status: CountByName[];
  by_f_tax_status: CountByName[];
  by_marketing: CountByName[];
};

export type BolagsverketStatisticsOverview = {
  source: "Bolagsverket";
  license: "CC BY 2.5 SE";
  last_successful_import_at: string | null;
  company_dynamics: Array<{
    period: string;
    registered: number | null;
    closed: number | null;
    net_change: number | null;
    total_registered: number | null;
  }>;
  company_forms: CountByName[];
  representative_history: Array<{
    year: number;
    chief_executives: number;
    board_members: number;
    chairpersons: number;
    deputies: number;
  }>;
  representative_roles: CountByName[];
  auditor_reservations: Array<{
    year: number;
    formation_type_code: string;
    formation_type_name: string;
    company_count: number;
    with_auditor_at_formation_count: number;
    with_auditor_reservation_count: number;
    without_auditor_with_reservation_count: number;
    with_auditor_reservation_share: number;
    without_auditor_with_reservation_share: number;
  }>;
  filing_delays: Array<{
    year: number;
    expected_to_file_count: number;
    filed_annual_report_count: number;
    late_fee_count: number;
    filed_annual_report_share: number;
    late_fee_share: number;
  }>;
};

// ------------------------------------------------------------
// Admin: imports and data health
// ------------------------------------------------------------

export type IngestionStatus = "running" | "done" | "failed" | "interrupted";

export type AdminSourceSummary = {
  source: string;
  source_name: string;
  runs: number;
  done: number;
  failed: number;
  records_seen: number;
  records_new: number;
  records_changed: number;
  records_skipped: number;
  latest_started_at: string | null;
  latest_successful_import_at: string | null;
};

export type AdminIngestionRun = {
  id: number;
  source: string;
  source_name: string;
  dataset: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number;
  source_as_of_date: string | null;
  filename: string | null;
  file_checksum: string | null;
  schema_version: string;
  metadata: Record<string, unknown>;
  records_seen: number;
  records_new: number;
  records_changed: number;
  records_skipped: number;
  last_row_number: number;
  status: IngestionStatus;
  error: string | null;
  quality_issue_count: number;
};

export type AdminDataOverview = {
  generated_at: string;
  summary: {
    runs_total: number;
    done: number;
    failed: number;
    running: number;
    interrupted: number;
    quality_issues_total: number;
    database_size_bytes: number;
    latest_successful_import_at: string | null;
  };
  source_summaries: AdminSourceSummary[];
  ingestion_runs: AdminIngestionRun[];
  quality_issues_by_code: Array<{ issue_code: string; count: number }>;
  recent_quality_issues: Array<{
    id: number;
    ingestion_run_id: number;
    source: string;
    row_number: number | null;
    issue_code: string;
    detail: string;
    observed_at: string;
  }>;
  table_stats: Array<{
    schema_name: string;
    table_name: string;
    estimated_rows: number;
    dead_rows: number;
    total_bytes: number;
    last_analyze: string | null;
    last_autoanalyze: string | null;
  }>;
  cache_entries: Array<{
    scope: string;
    generated_at: string;
    expires_at: string;
  }>;
  overview_metadata: OverviewMetadata | null;
  overview_totals: Record<string, number>;
  search_metrics: {
    window_hours: number;
    data_requests: number;
    autocomplete_requests: number;
    p50_ms: number | null;
    p95_ms: number | null;
    timeout_percent: number;
    zero_result_percent: number;
    reformulation_percent: number;
    fuzzy_percent: number;
    average_filter_count: number;
    clicks: number;
    average_click_position: number | null;
  };
  search_filter_usage: Array<{ filter_key: string; searches: number }>;
};

// ------------------------------------------------------------
// Saved segments
// ------------------------------------------------------------

export type SavedSegment = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
  visibility: string;
  match_profile_id: string | null;
  source: string;
  result_count: number | null;
  last_result_count_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedSegmentPayload = {
  name: string;
  description?: string | null;
  filters?: Record<string, unknown>;
  sort?: Record<string, unknown>;
  visibility?: string;
  match_profile_id?: string | null;
  source?: string;
  result_count?: number | null;
};

export type SavedSegmentsResponse = {
  items: SavedSegment[];
};

// ------------------------------------------------------------
// Profile
// ------------------------------------------------------------

export type AppUserProfile = {
  id: string;
  company_id?: number | null;
  company_pe_org_nr?: string | null;
  auth_provider: string | null;
  auth_subject: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
  company_org_nr: string | null;
  company_entity_type?: "organization" | "person" | "other" | null;
  company_name: string | null;
  company_registered_name?: string | null;
  postal_city: string | null;
  county_code: string | null;
  county_name: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  company_description: string | null;
  ideal_customer_description: string | null;
  settings: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
};

export type AppUserProfilePayload = {
  company_id?: number | null;
  auth_provider?: string | null;
  auth_subject?: string | null;
  email?: string | null;
  display_name?: string | null;
  role?: string;
  company_org_nr?: string | null;
  company_description?: string | null;
  ideal_customer_description?: string | null;
  settings?: Record<string, unknown>;
};
