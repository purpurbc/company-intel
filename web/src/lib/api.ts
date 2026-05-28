// src/lib/api.ts
import type {
  CompaniesResponse,
  CountyOverviewResponse,
  MunicipalityOverviewResponse,
  SwedenOverview,
  CompanyResponse,
  CompanyTurnoverHistoryResponse,
  ListCompaniesParams,
} from "@/src/lib/types";

export const API = process.env.NEXT_PUBLIC_API_BASE;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} (${url})`);
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
  limit = 100,
  offset = 0,
}: ListCompaniesParams = {}) {
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

  return fetchJson<CompaniesResponse>(`${API}/companies?${params.toString()}`);
}

export async function getCompany(orgNr: string): Promise<CompanyResponse> {
  return fetchJson(`${API}/company/${encodeURIComponent(orgNr)}`);
}

export async function getCompanyTurnoverHistory(
  orgNr: string
): Promise<CompanyTurnoverHistoryResponse> {
  return fetchJson<CompanyTurnoverHistoryResponse>(
    `${API}/company/${encodeURIComponent(orgNr)}/turnover-history`
  );
}

export async function getCountyOverview(
  countyCode: string
): Promise<CountyOverviewResponse> {
  return fetchJson<CountyOverviewResponse>(
    `${API}/county/${encodeURIComponent(countyCode)}`
  );
}

export async function getMunicipalityOverview(
  municipalityCode: string
): Promise<MunicipalityOverviewResponse> {
  return fetchJson<MunicipalityOverviewResponse>(
    `${API}/municipality/${encodeURIComponent(municipalityCode)}`
  );
}

export async function getSwedenOverview(): Promise<SwedenOverview> {
  return fetchJson<SwedenOverview>(`${API}/sweden`);
}
