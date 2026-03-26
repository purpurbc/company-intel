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
  county_code,
  municipality_code,
  limit = 25,
  offset = 0,
}: ListCompaniesParams = {}) {
  const params = new URLSearchParams();

  if (q?.trim()) params.set("q", q.trim());
  if (search_by) params.set("search_by", search_by);
  if (county_code?.trim()) params.set("county_code", county_code.trim());
  if (municipality_code?.trim()) {
    params.set("municipality_code", municipality_code.trim());
  }

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return fetchJson<CompaniesResponse>(`${API}/companies?${params}`);
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