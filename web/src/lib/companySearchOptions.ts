import type {
  CompanyMetricSort,
  CompanyNameSort,
  CompanySearchBy,
} from "@/src/lib/types";

export const COMPANY_SEARCH_BY_OPTIONS: Array<{
  value: CompanySearchBy;
  label: string;
}> = [
  { value: "all", label: "Sök i alla" },
  { value: "company_name", label: "Företagsnamn" },
  { value: "org_nr", label: "Org.nr" },
];

export const COMPANY_NAME_SORT_OPTIONS: Array<{
  value: CompanyNameSort;
  label: string;
}> = [
  { value: "asc", label: "A–Ö" },
  { value: "desc", label: "Ö–A" },
];

export const COMPANY_METRIC_SORT_OPTIONS: Array<{
  value: CompanyMetricSort;
  label: string;
}> = [
  { value: "none", label: "Ingen" },
  { value: "turnover_asc", label: "Omsättning: lägst först" },
  { value: "turnover_desc", label: "Omsättning: högst först" },
  { value: "size_asc", label: "Antal anställda: färst först" },
  { value: "size_desc", label: "Antal anställda: flest först" },
];

export function companyNameSortValue(value: unknown): CompanyNameSort {
  return value === "desc" ? "desc" : "asc";
}

export function companyMetricSortValue(value: unknown): CompanyMetricSort {
  return value === "turnover_asc" ||
    value === "turnover_desc" ||
    value === "size_asc" ||
    value === "size_desc"
    ? value
    : "none";
}
