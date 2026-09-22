// src/lib/api.ts
import type {
  AppUserProfile,
  AppUserProfilePayload,
  CompaniesResponse,
  Company,
  CountyOverview,
  MunicipalityOverview,
  SwedenOverview,
  CompanyEventHistoryResponse,
  CompanyTurnoverHistoryResponse,
  ListCompaniesParams,
  SavedSegment,
  SavedSegmentPayload,
  SavedSegmentsResponse,
  AdminDataOverview,
  BolagsverketStatisticsOverview,
} from "@/src/lib/types";

export const API = process.env.NEXT_PUBLIC_API_BASE;

async function apiError(res: Response, url: string) {
  let detail: unknown = null;
  try {
    detail = (await res.json())?.detail;
  } catch {
    // Keep the generic fallback when the API did not return JSON.
  }
  return new Error(
    typeof detail === "string"
      ? detail
      : `API-fel: ${res.status} (${url})`,
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw await apiError(res, url);
  return res.json() as Promise<T>;
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw await apiError(res, url);
  return res.json() as Promise<T>;
}

async function sendJson<T>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await apiError(res, url);
  return res.json() as Promise<T>;
}

export async function listCompanies({
  q,
  search_by = "all",
  county_codes,
  municipality_codes,
  company_status_codes,
  company_state_codes,
  employer_status_codes,
  vat_status_codes,
  f_tax_status_codes,
  marketing_status_codes,
  size_class_codes,
  age_min,
  age_max,
  post_ort,
  post_nr,
  owner_category_codes,
  sme_size_codes,
  export_import_marks,
  section_codes,
  industry_codes,
  industry_detail_codes,
  turnover_size_codes,
  name_sort = "asc",
  metric_sort = "none",
  limit = 50,
  offset = 0,
  include_total,
  count_only,
  search_id,
  reformulated,
}: ListCompaniesParams = {}, options: { signal?: AbortSignal } = {}) {
  const params = new URLSearchParams();

  if (q?.trim()) params.set("q", q.trim());
  
  if (search_by) params.set("search_by", search_by);

  county_codes?.forEach((value) => 
    params.append("county_codes", value)
  );

  municipality_codes?.forEach((value) =>
    params.append("municipality_codes", value)
  );

  company_status_codes?.forEach((value) =>
    params.append("company_status_codes", value)
  );

  company_state_codes?.forEach((value) =>
    params.append("company_state_codes", value)
  );

  employer_status_codes?.forEach((value) =>
    params.append("employer_status_codes", value)
  );

  vat_status_codes?.forEach((value) =>
    params.append("vat_status_codes", value)
  );

  f_tax_status_codes?.forEach((value) =>
    params.append("f_tax_status_codes", value)
  );

  marketing_status_codes?.forEach((value) =>
    params.append("marketing_status_codes", value)
  );

  size_class_codes?.forEach((value) =>
    params.append("size_class_codes", value)
  );

  if (typeof age_min === "number") params.set("age_min", String(age_min));
  if (typeof age_max === "number") params.set("age_max", String(age_max));
  if (post_ort?.trim()) params.set("post_ort", post_ort.trim());
  if (post_nr?.trim()) params.set("post_nr", post_nr.trim());

  owner_category_codes?.forEach((value) =>
    params.append("owner_category_codes", value)
  );

  sme_size_codes?.forEach((value) =>
    params.append("sme_size_codes", value)
  );

  export_import_marks?.forEach((value) =>
    params.append("export_import_marks", value)
  );

  section_codes?.forEach((value) =>
    params.append("section_codes", value)
  );

  industry_codes?.forEach((value) => 
    params.append("industry_codes", value)
  );

  industry_detail_codes?.forEach((value) =>
    params.append("industry_detail_codes", value)
  );

  turnover_size_codes?.forEach((value) =>
    params.append("turnover_size_codes", value)
  );

  params.set("name_sort", name_sort);
  params.set("metric_sort", metric_sort);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (include_total) params.set("include_total", "true");
  if (count_only) params.set("count_only", "true");
  if (search_id) params.set("search_id", search_id);
  if (reformulated) params.set("reformulated", "true");

  return fetchJson<CompaniesResponse>(`${API}/companies?${params.toString()}`, {
    signal: options.signal,
  });
}

export async function recordCompanySearchClick(
  searchId: string,
  companyId: number,
  position: number,
) {
  return fetchJson<{ ok: true }>(`${API}/companies/search-events/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      search_id: searchId,
      company_id: companyId,
      position,
    }),
    keepalive: true,
  });
}

export async function getCompany(orgNr: string): Promise<Company | null> {
  return fetchJsonOrNull(`${API}/company/${encodeURIComponent(orgNr)}`);
}

export async function getCompanyTurnoverHistory(
  orgNr: string
): Promise<CompanyTurnoverHistoryResponse> {
  return fetchJson<CompanyTurnoverHistoryResponse>(
    `${API}/company/${encodeURIComponent(orgNr)}/turnover-history`
  );
}

export async function getCompanyEventHistory(
  orgNr: string
): Promise<CompanyEventHistoryResponse> {
  return fetchJson<CompanyEventHistoryResponse>(
    `${API}/company/${encodeURIComponent(orgNr)}/events`
  );
}

export async function getCountyOverview(
  countyCode: string
): Promise<CountyOverview | null> {
  return fetchJsonOrNull<CountyOverview>(
    `${API}/county/${encodeURIComponent(countyCode)}`
  );
}

export async function getMunicipalityOverview(
  municipalityCode: string
): Promise<MunicipalityOverview | null> {
  return fetchJsonOrNull<MunicipalityOverview>(
    `${API}/municipality/${encodeURIComponent(municipalityCode)}`
  );
}

export async function getSwedenOverview(): Promise<SwedenOverview> {
  return fetchJson<SwedenOverview>(`${API}/sweden`);
}

export async function getBolagsverketStatistics(): Promise<BolagsverketStatisticsOverview> {
  return fetchJson<BolagsverketStatisticsOverview>(
    `${API}/sweden/bolagsverket-statistics`,
  );
}

export async function getAdminDataOverview(): Promise<AdminDataOverview> {
  return fetchJson<AdminDataOverview>(`${API}/admin/data`);
}

export async function listSavedSegments(): Promise<SavedSegmentsResponse> {
  return fetchJson<SavedSegmentsResponse>(`${API}/saved-segments`);
}

export async function createSavedSegment(
  payload: SavedSegmentPayload,
): Promise<SavedSegment> {
  return sendJson<SavedSegment>(`${API}/saved-segments`, "POST", payload);
}

export async function updateSavedSegment(
  id: string,
  payload: SavedSegmentPayload,
): Promise<SavedSegment> {
  return sendJson<SavedSegment>(
    `${API}/saved-segments/${encodeURIComponent(id)}`,
    "PUT",
    payload,
  );
}

export async function deleteSavedSegment(
  id: string,
): Promise<{ ok: boolean; id: string }> {
  return sendJson<{ ok: boolean; id: string }>(
    `${API}/saved-segments/${encodeURIComponent(id)}`,
    "DELETE",
  );
}

export async function refreshSavedSegmentCount(
  id: string,
): Promise<SavedSegment> {
  return sendJson<SavedSegment>(
    `${API}/saved-segments/${encodeURIComponent(id)}/refresh-count`,
    "POST",
  );
}

export async function touchSavedSegment(id: string): Promise<SavedSegment> {
  return sendJson<SavedSegment>(
    `${API}/saved-segments/${encodeURIComponent(id)}/touch`,
    "POST",
  );
}

export async function getUserProfile(): Promise<AppUserProfile> {
  return fetchJson<AppUserProfile>(`${API}/user-profile`);
}

export async function updateUserProfile(
  payload: AppUserProfilePayload,
): Promise<AppUserProfile> {
  return sendJson<AppUserProfile>(`${API}/user-profile`, "PUT", payload);
}
