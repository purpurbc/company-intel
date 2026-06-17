// ============================================================
// Shared types for Company Intel
// Mirrors the fields returned by the FastAPI backend,
// which in turn mirrors SCB SokPaVar (Je = företag, Ae = arbetsställe)
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
};

/** Lightweight shape returned by GET /companies (list view) */
export type CompanyListItem = {
  org_nr: string;
  company_name: string;
  post_ort: string | null;
  seat_county_code?: string | null;
  seat_county_name: string | null;
  seat_municipality_code?: string | null;
  seat_municipality_name: string | null;
  industry_5_name: string | null;
  size_class_code?: string | null;
  size_class_name?: string | null;
  turnover_gross_name?: string | null;
  turnover_fin_name?: string | null;
  company_status_code?: string | null;
  company_status_name?: string | null;
  company_state_code?: string | null;
  company_state_name?: string | null;
  employer_status_code?: string | null;
  employer_status_name?: string | null;
};

/** Full shape returned by GET /company/:org_nr (detail view) */
export type Company = {
  // --- Identity ---
  org_nr: string;
  company_name: string;

  // --- Location ---
  post_ort: string | null;
  seat_county: string | null;
  seat_municipality: string | null;

  // --- Industry / classification ---
  bransch_1: string | null;       // SNI code level 1 description
  bransch_2: string | null;
  avdelning_1: string | null;     // division
  industry_5_name: string | null; // SNI 5-digit description

  // --- Size ---
  size_class: string | null;          // number of employees band
  turnover_fin_size: string | null;   // turnover band (financial)

  // --- Legal / status ---
  legal_form: string | null;
  sector: string | null;
  company_status: string | null;
  company_state: string | null;

  // Escape hatch: backend may return extra fields we haven't typed yet
  [key: string]: unknown;
};

export type CompanyNotFound = {
  error: "not_found";
};

export type CompanyResponse = Company | CompanyNotFound;

export type CompaniesResponse = PaginatedResponse<CompanyListItem>;

export type CompanyTurnoverHistoryItem = {
  year: number;
  turnover_size_code: string | null;
  turnover_size: string | null;
  turnover_fin_size_code: string | null;
  turnover_fin_size: string | null;
  source: "current" | "history";
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
  post_ort: string | null;
  seat_municipality_name: string | null;
  seat_county_name: string | null;
  industry_5_name: string | null;
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
  post_ort: string | null;
  post_address: string | null;
  seat_county: string | null;
  seat_municipality: string | null;

  // --- Industry / classification ---
  bransch_1: string | null;
  industry_5_name: string | null;

  // --- Size ---
  size_class: string | null;

  // --- Status ---
  workplace_status: string | null;

  [key: string]: unknown;
};

export type WorkplacesResponse = PaginatedResponse<WorkplaceListItem>;

// ------------------------------------------------------------
// County overview (Län)
// ------------------------------------------------------------

export type CountByName = {
  code: string,
  name: string;
  count: number;
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

  by_municipality: CountByName[];
  by_aregion: CountByName[];
  by_industry: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
};

export type CountyOverviewNotFound = {
  error: "not_found";
};

export type CountyOverviewResponse = CountyOverview | CountyOverviewNotFound;

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

  by_industry: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
  by_aregion: CountByName[];
};

export type MunicipalityOverviewNotFound = {
  error: "not_found";
};

export type MunicipalityOverviewResponse =
  | MunicipalityOverview
  | MunicipalityOverviewNotFound;

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
    accepts_marketing: number;
    counties: number;
    municipalities: number;
    industry_groups: number;
  };

  by_county: CountByName[];
  by_municipality: CountByName[];
  by_industry: CountByName[];
  by_section: CountByName[];
  by_size: CountByName[];
  by_turnover: CountByName[];
  by_status: CountByName[];
  by_state: CountByName[];
  by_employer_status: CountByName[];
  by_vat_status: CountByName[];
  by_f_tax_status: CountByName[];
  by_marketing: CountByName[];
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
  intent: string | null;
  notes: string | null;
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
  intent?: string | null;
  notes?: string | null;
  match_profile_id?: string | null;
  source?: string;
  result_count?: number | null;
};

export type SavedSegmentsResponse = {
  items: SavedSegment[];
};

// ------------------------------------------------------------
// Profile workspace: offers and existing customers
// ------------------------------------------------------------

export type AppUserProfile = {
  id: string;
  auth_provider: string | null;
  auth_subject: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
  company_org_nr: string | null;
  company_name: string | null;
  post_ort: string | null;
  seat_county_code: string | null;
  seat_county_name: string | null;
  seat_municipality_code: string | null;
  seat_municipality_name: string | null;
  company_description: string | null;
  ideal_customer_description: string | null;
  settings: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
};

export type AppUserProfilePayload = {
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

export type SalesOffer = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target: string | null;
  saved_segment_id: string | null;
  saved_segment_name: string | null;
  customer_ids: string[];
  created_at: string;
  updated_at: string;
};

export type SalesOfferPayload = {
  name: string;
  description?: string | null;
  target?: string | null;
  saved_segment_id?: string | null;
  customer_ids?: string[];
};

export type SalesOffersResponse = {
  items: SalesOffer[];
};

export type CustomerAccount = {
  id: string;
  user_id: string;
  org_nr: string;
  company_name: string;
  post_ort: string | null;
  seat_county_code: string | null;
  seat_county_name: string | null;
  seat_municipality_code: string | null;
  seat_municipality_name: string | null;
  customer_labels: string[];
  connection_text: string | null;
  why_fit: string | null;
  pain_points: string | null;
  buying_trigger: string | null;
  outcome: string | null;
  tags: string[];
  fit_score: number;
  offer_ids: string[];
  offer_names: string[];
  created_at: string;
  updated_at: string;
};

export type CustomerAccountPayload = {
  org_nr: string;
  customer_labels?: string[];
  offer_ids?: string[];
  connection_text?: string | null;
  why_fit?: string | null;
  pain_points?: string | null;
  buying_trigger?: string | null;
  outcome?: string | null;
  tags?: string[];
  fit_score: number;
};

export type CustomerAccountsResponse = {
  items: CustomerAccount[];
};
