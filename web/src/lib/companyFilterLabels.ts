import {
  COUNTY_OPTIONS,
  INDUSTRY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  SIZE_OPTIONS,
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

type FilterOption = { value: string; label: string };

export const FILTER_LABELS: Record<string, string> = {
  q: "Söktext",
  search_by: "Sökfält",
  county_codes: "Län",
  municipality_codes: "Kommun",
  company_status_codes: "Företagsstatus",
  company_state_codes: "Risk/statusläge",
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
  sme_size_codes: "SME-klass",
  export_import_marks: "Export/import",
  section_codes: "Avdelning",
  industry_codes: "Branschgrupp",
  industry_detail_codes: "SNI-kod",
  turnover_size_codes: "Omsättning",
};

const SEARCH_BY_OPTIONS: FilterOption[] = [
  { value: "all", label: "Sök i alla" },
  { value: "company_name", label: "Företagsnamn" },
  { value: "org_nr", label: "Org.nr" },
];

const EMPLOYER_STATUS_OPTIONS: FilterOption[] = [
  { value: "0", label: "Har aldrig varit registrerad som arbetsgivare" },
  { value: "1", label: "Är registrerad som vanlig arbetsgivare" },
  { value: "2", label: "Är registrerad som privatarbetsgivare" },
  { value: "3", label: "Är registrerad som arbetsgivare via representant" },
  { value: "4", label: "Är registrerad som ambassad eller konsulat" },
  { value: "9", label: "Är avregistrerad som arbetsgivare" },
];

const VAT_STATUS_OPTIONS: FilterOption[] = [
  { value: "0", label: "Har aldrig varit registrerad för moms" },
  { value: "1", label: "Är registrerad för moms" },
  { value: "3", label: "Är registrerad för moms via representant" },
  { value: "9", label: "Är avregistrerad för moms" },
];

const F_TAX_STATUS_OPTIONS: FilterOption[] = [
  { value: "0", label: "Har aldrig varit registrerad för F-skatt" },
  { value: "1", label: "Är registrerad för F-skatt" },
  { value: "9", label: "Är avregistrerad för F-skatt" },
];

const MARKETING_STATUS_OPTIONS: FilterOption[] = [
  { value: "11", label: "Tar emot reklam, ej telefonnummerspärrat" },
  { value: "12", label: "Tar emot reklam, telefonnummerspärr telemarketing" },
  { value: "13", label: "Tar emot reklam, nix-telefon" },
  { value: "21", label: "Har frånsagt sig reklam, ej telefonnummerspärrat" },
  { value: "22", label: "Har frånsagt sig reklam, telefonnummerspärr telemarketing" },
  { value: "23", label: "Har frånsagt sig reklam, nix-telefon" },
];

const OWNER_CATEGORY_OPTIONS: FilterOption[] = [
  { value: "10", label: "Statligt" },
  { value: "20", label: "Kommunalt" },
  { value: "30", label: "Regioner" },
  { value: "41", label: "Privat svenskt utan koncern" },
  { value: "42", label: "Privat svenskt med koncern" },
  { value: "50", label: "Utländska" },
];

const SME_SIZE_OPTIONS: FilterOption[] = [
  { value: "0", label: "0 anställda" },
  { value: "1", label: "1-9 anställda" },
  { value: "2", label: "10-49 anställda" },
  { value: "3", label: "50-249 anställda" },
  { value: "4", label: "250-499 anställda" },
  { value: "5", label: "Minst 500 anställda" },
];

const EXPORT_IMPORT_OPTIONS: FilterOption[] = [
  { value: "J", label: "Har export/import-markering" },
];

const FILTER_VALUE_OPTIONS: Record<string, FilterOption[]> = {
  search_by: SEARCH_BY_OPTIONS,
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
  return option ? `${value} ${option.label}` : value;
}

export function filterValueLabel(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => filterValueLabel(key, item)).join(", ");
  }
  if (typeof value === "string") return optionLabel(key, value);
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}
