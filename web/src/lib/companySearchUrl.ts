import type {
  CompanyMetricSort,
  CompanyNameSort,
  CompanySearchBy,
  ListCompaniesParams,
} from "@/src/lib/types";
import {
  COMPANY_MAX_PAGES,
  COMPANY_PAGE_SIZE_OPTIONS,
  COMPANY_RESULT_WINDOW_LIMIT,
  companyResultPageCount,
} from "@/src/lib/pagination";

const ARRAY_KEYS = [
  "county_codes",
  "municipality_codes",
  "company_status_codes",
  "company_state_codes",
  "employer_status_codes",
  "vat_status_codes",
  "f_tax_status_codes",
  "marketing_status_codes",
  "size_class_codes",
  "owner_category_codes",
  "sme_size_codes",
  "export_import_marks",
  "section_codes",
  "industry_codes",
  "industry_detail_codes",
  "turnover_size_codes",
] as const;

type ArrayKey = (typeof ARRAY_KEYS)[number];

export type CompanySearchUrlState = {
  q: string;
  search_by: CompanySearchBy;
  name_sort: CompanyNameSort;
  metric_sort: CompanyMetricSort;
  limit: number;
  offset: number;
  age_min?: number;
  age_max?: number;
  post_ort?: string;
  post_nr?: string;
} & Record<ArrayKey, string[]>;

const VALID_SEARCH_BY = new Set<CompanySearchBy>([
  "all",
  "company_name",
  "org_nr",
]);
const VALID_NAME_SORT = new Set<CompanyNameSort>(["asc", "desc"]);
const VALID_METRIC_SORT = new Set<CompanyMetricSort>([
  "none",
  "turnover_asc",
  "turnover_desc",
  "size_asc",
  "size_desc",
]);
const VALID_LIMITS = new Set<number>(COMPANY_PAGE_SIZE_OPTIONS);

function enumValue<T extends string>(
  value: string | null,
  allowed: ReadonlySet<T>,
  fallback: T,
) {
  return value && allowed.has(value as T) ? (value as T) : fallback;
}

function boundedInteger(
  value: string | null,
  minimum: number,
  maximum: number,
) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function stringValues(params: URLSearchParams, key: ArrayKey) {
  return [...new Set(params.getAll(key).map((value) => value.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "sv-SE"));
}

/**
 * URL state is authoritative whenever the URL has a query string. An empty
 * query returns null so the first visit may still use the session fallback.
 */
export function readCompanySearchUrl(
  search: string,
): CompanySearchUrlState | null {
  const params = new URLSearchParams(search);
  if (params.size === 0) return null;

  const requestedLimit = boundedInteger(params.get("limit"), 1, 500);
  const limit = requestedLimit && VALID_LIMITS.has(requestedLimit)
    ? requestedLimit
    : 50;
  const requestedPage =
    boundedInteger(params.get("page"), 1, COMPANY_MAX_PAGES) ?? 1;
  const page = Math.min(
    requestedPage,
    companyResultPageCount(
      COMPANY_RESULT_WINDOW_LIMIT,
      limit,
      COMPANY_RESULT_WINDOW_LIMIT,
    ),
  );
  const ageMin = boundedInteger(params.get("age_min"), 0, 100);
  const ageMax = boundedInteger(params.get("age_max"), 0, 100);
  const state = {
    q: params.get("q")?.trim() ?? "",
    search_by: enumValue(params.get("search_by"), VALID_SEARCH_BY, "all"),
    name_sort: enumValue(params.get("name_sort"), VALID_NAME_SORT, "asc"),
    metric_sort: enumValue(
      params.get("metric_sort"),
      VALID_METRIC_SORT,
      "none",
    ),
    limit,
    offset: (page - 1) * limit,
    age_min: ageMin,
    age_max: ageMax,
    post_ort: params.get("post_ort")?.trim() || undefined,
    post_nr: params.get("post_nr")?.trim() || undefined,
  } as CompanySearchUrlState;

  for (const key of ARRAY_KEYS) state[key] = stringValues(params, key);
  return state;
}

function appendValues(
  params: URLSearchParams,
  key: ArrayKey,
  values: string[] | undefined,
) {
  if (!values) return;
  for (const value of [...new Set(values.map((item) => item.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "sv-SE"))) {
    params.append(key, value);
  }
}

/** Build the canonical, shareable URL for an executed company search. */
export function companySearchHref(
  search: ListCompaniesParams,
  offset = search.offset ?? 0,
) {
  const params = new URLSearchParams();
  // Marks even the default search as explicit URL state. A plain /companies
  // visit may restore the local session; a generated link never does.
  params.set("search", "1");
  const q = search.q?.trim();
  if (q) params.set("q", q);
  if (search.search_by && search.search_by !== "all") {
    params.set("search_by", search.search_by);
  }

  for (const key of ARRAY_KEYS) appendValues(params, key, search[key]);

  if (typeof search.age_min === "number" && search.age_min > 0) {
    params.set("age_min", String(search.age_min));
  }
  if (typeof search.age_max === "number" && search.age_max < 100) {
    params.set("age_max", String(search.age_max));
  }
  if (search.post_ort?.trim()) params.set("post_ort", search.post_ort.trim());
  if (search.post_nr?.trim()) params.set("post_nr", search.post_nr.trim());
  if (search.name_sort && search.name_sort !== "asc") {
    params.set("name_sort", search.name_sort);
  }
  if (search.metric_sort && search.metric_sort !== "none") {
    params.set("metric_sort", search.metric_sort);
  }

  const limit = search.limit ?? 50;
  if (limit !== 50) params.set("limit", String(limit));
  const page = Math.min(
    companyResultPageCount(
      COMPANY_RESULT_WINDOW_LIMIT,
      limit,
      COMPANY_RESULT_WINDOW_LIMIT,
    ),
    Math.floor(Math.max(0, offset) / limit) + 1,
  );
  if (page > 1) params.set("page", String(page));

  return `/companies?${params.toString()}`;
}

export function updateCompanySearchUrl(
  search: ListCompaniesParams,
  offset: number,
  mode: "push" | "replace",
) {
  const href = companySearchHref(search, offset);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) return;
  window.history[mode === "push" ? "pushState" : "replaceState"](
    null,
    "",
    href,
  );
}
