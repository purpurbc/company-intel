import {
  COUNTY_OPTIONS,
  EMPLOYER_STATUS_OPTIONS,
  EXPORT_IMPORT_OPTIONS,
  F_TAX_STATUS_OPTIONS,
  INDUSTRY_OPTIONS,
  MARKETING_STATUS_OPTIONS,
  MUNICIPALITY_OPTIONS,
  OWNER_CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  SME_SIZE_OPTIONS,
  VAT_STATUS_OPTIONS,
  type FilterOption,
} from "@/src/lib/companyFilterOptions";
import {
  INDUSTRY_DETAIL_OPTIONS,
  SECTION_OPTIONS,
  TURNOVER_OPTIONS,
} from "@/src/lib/companyAdvancedFilterOptions";
import {
  COMPANY_STATE_OPTIONS,
  COMPANY_STATUS_OPTIONS,
} from "@/src/lib/companyStatus";
import { COMPANY_SEARCH_BY_OPTIONS } from "@/src/lib/companySearchOptions";

export const FILTER_LABELS: Record<string, string> = {
  q: "Söktext",
  search_by: "Sökfält",
  county_codes: "Län",
  municipality_codes: "Kommun",
  company_status_codes: "Verksamhetsstatus",
  company_state_codes: "Bolagsläge / riskläge",
  employer_status_codes: "Arbetsgivare",
  vat_status_codes: "Moms",
  f_tax_status_codes: "F-skatt",
  marketing_status_codes: "Reklamstatus",
  size_class_codes: "Storlek",
  age_min: "Min ålder",
  age_max: "Max ålder",
  post_ort: "Postort",
  post_nr: "Postnummer",
  owner_category_codes: "Ägarstruktur",
  sme_size_codes: "SMF-klass",
  export_import_marks: "Export/import",
  section_codes: "Avdelning",
  industry_codes: "Branschgrupp",
  industry_detail_codes: "SNI-kod",
  turnover_size_codes: "Omsättning",
};

const FILTER_VALUE_OPTIONS: Record<string, FilterOption[]> = {
  search_by: COMPANY_SEARCH_BY_OPTIONS,
  county_codes: COUNTY_OPTIONS,
  municipality_codes: MUNICIPALITY_OPTIONS,
  company_status_codes: COMPANY_STATUS_OPTIONS,
  company_state_codes: COMPANY_STATE_OPTIONS,
  employer_status_codes: EMPLOYER_STATUS_OPTIONS,
  vat_status_codes: VAT_STATUS_OPTIONS,
  f_tax_status_codes: F_TAX_STATUS_OPTIONS,
  marketing_status_codes: MARKETING_STATUS_OPTIONS,
  size_class_codes: SIZE_OPTIONS,
  owner_category_codes: OWNER_CATEGORY_OPTIONS,
  sme_size_codes: SME_SIZE_OPTIONS,
  export_import_marks: EXPORT_IMPORT_OPTIONS,
  section_codes: SECTION_OPTIONS,
  industry_codes: INDUSTRY_OPTIONS,
  industry_detail_codes: INDUSTRY_DETAIL_OPTIONS,
  turnover_size_codes: TURNOVER_OPTIONS,
};

function optionLabel(key: string, value: string): string {
  const option = FILTER_VALUE_OPTIONS[key]?.find((item) => item.value === value);
  if (!option) return value;
  return key === "search_by" ? option.label : `${value} ${option.label}`;
}

export function filterValueLabel(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => filterValueLabel(key, item)).join(", ");
  }
  if (typeof value === "string") return optionLabel(key, value);
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}
