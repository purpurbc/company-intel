// src/lib/api.ts
import type {
  CompaniesResponse,
  CountyOverviewResponse,
  CompanyResponse,
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
  size_class_codes,
  industry_codes,
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

  size_class_codes?.forEach((value) =>
    params.append("size_class_codes", value)
  );

  industry_codes?.forEach((value) => 
    params.append("industry_codes", value)
  );

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return fetchJson<CompaniesResponse>(`${API}/companies?${params.toString()}`);
}

export async function getCompany(orgNr: string): Promise<CompanyResponse> {
  return fetchJson(`${API}/company/${encodeURIComponent(orgNr)}`);
}

export async function getCountyOverview(
  countyCode: string
): Promise<CountyOverviewResponse> {
  return fetchJson<CountyOverviewResponse>(
    `${API}/county/${encodeURIComponent(countyCode)}`
  );
}
