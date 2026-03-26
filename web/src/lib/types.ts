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
  | "org_nr"
  | "seat_municipality_name";


export type ListCompaniesParams = {
  q?: string;
  search_by?: CompanySearchBy;
  county_code?: string;
  municipality_code?: string;
  limit?: number;
  offset?: number;
};

/** Lightweight shape returned by GET /companies (list view) */
export type CompanyListItem = {
  org_nr: string;
  company_name: string;
  post_ort: string | null;
  seat_county_name: string | null;
  seat_municipality_name: string | null;
  industry_5_name: string | null;
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
};

export type CountyOverviewNotFound = {
  error: "not_found";
};

export type CountyOverviewResponse = CountyOverview | CountyOverviewNotFound;