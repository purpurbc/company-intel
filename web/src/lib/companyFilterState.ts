import type { CompanySearchBy } from "@/src/lib/types";

export type CompanyFilterState = {
  q: string;
  searchBy: CompanySearchBy;
  countyCodes: string[];
  municipalityCodes: string[];
  companyStatusCodes: string[];
  companyStateCodes: string[];
  employerStatusCodes: string[];
  vatStatusCodes: string[];
  fTaxStatusCodes: string[];
  marketingStatusCodes: string[];
  sizeClassCodes: string[];
  companyAgeRange: [number, number];
  postOrt: string;
  postNr: string;
  ownerCategoryCodes: string[];
  smeSizeCodes: string[];
  exportImportMarks: string[];
  sectionCodes: string[];
  industryCodes: string[];
  industryDetailCodes: string[];
  turnoverSizeCodes: string[];
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function ageValue(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function searchByValue(value: unknown): CompanySearchBy {
  return value === "company_name" || value === "org_nr" ? value : "all";
}

/** Converts the persisted API filter contract to the UI's filter state. */
export function companyFilterStateFromRecord(
  filters: Record<string, unknown> | undefined,
): CompanyFilterState {
  const source = filters ?? {};
  const ageMin = ageValue(source.age_min, 0);
  const ageMax = ageValue(source.age_max, 100);

  return {
    q: stringValue(source.q),
    searchBy: searchByValue(source.search_by),
    countyCodes: stringList(source.county_codes),
    municipalityCodes: stringList(source.municipality_codes),
    companyStatusCodes: stringList(source.company_status_codes),
    companyStateCodes: stringList(source.company_state_codes),
    employerStatusCodes: stringList(source.employer_status_codes),
    vatStatusCodes: stringList(source.vat_status_codes),
    fTaxStatusCodes: stringList(source.f_tax_status_codes),
    marketingStatusCodes: stringList(source.marketing_status_codes),
    sizeClassCodes: stringList(source.size_class_codes),
    companyAgeRange: [Math.min(ageMin, ageMax), Math.max(ageMin, ageMax)],
    postOrt: stringValue(source.post_ort),
    postNr: stringValue(source.post_nr),
    ownerCategoryCodes: stringList(source.owner_category_codes),
    smeSizeCodes: stringList(source.sme_size_codes),
    exportImportMarks: stringList(source.export_import_marks),
    sectionCodes: stringList(source.section_codes),
    industryCodes: stringList(source.industry_codes),
    industryDetailCodes: stringList(source.industry_detail_codes),
    turnoverSizeCodes: stringList(source.turnover_size_codes),
  };
}

/**
 * Converts UI state to the API contract. Unknown keys are retained so older
 * clients do not erase filters added by a newer backend.
 */
export function companyFilterRecordFromState(
  state: CompanyFilterState,
  base?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(base ?? {}),
    q: state.q.trim(),
    search_by: state.searchBy,
    county_codes: state.countyCodes,
    municipality_codes: state.municipalityCodes,
    company_status_codes: state.companyStatusCodes,
    company_state_codes: state.companyStateCodes,
    employer_status_codes: state.employerStatusCodes,
    vat_status_codes: state.vatStatusCodes,
    f_tax_status_codes: state.fTaxStatusCodes,
    marketing_status_codes: state.marketingStatusCodes,
    size_class_codes: state.sizeClassCodes,
    age_min: state.companyAgeRange[0] > 0 ? state.companyAgeRange[0] : null,
    age_max: state.companyAgeRange[1] < 100 ? state.companyAgeRange[1] : null,
    post_ort: state.postOrt.trim(),
    post_nr: state.postNr.trim(),
    owner_category_codes: state.ownerCategoryCodes,
    sme_size_codes: state.smeSizeCodes,
    export_import_marks: state.exportImportMarks,
    section_codes: state.sectionCodes,
    industry_codes: state.industryCodes,
    industry_detail_codes: state.industryDetailCodes,
    turnover_size_codes: state.turnoverSizeCodes,
  };
}

export function countCompanyFilterSelections(state: CompanyFilterState) {
  return (
    state.countyCodes.length +
    state.municipalityCodes.length +
    state.companyStatusCodes.length +
    state.companyStateCodes.length +
    state.employerStatusCodes.length +
    state.vatStatusCodes.length +
    state.fTaxStatusCodes.length +
    state.marketingStatusCodes.length +
    state.sizeClassCodes.length +
    (state.companyAgeRange[0] > 0 || state.companyAgeRange[1] < 100 ? 1 : 0) +
    (state.postOrt.trim() ? 1 : 0) +
    (state.postNr.trim() ? 1 : 0) +
    state.ownerCategoryCodes.length +
    state.smeSizeCodes.length +
    state.exportImportMarks.length +
    state.sectionCodes.length +
    state.industryCodes.length +
    state.industryDetailCodes.length +
    state.turnoverSizeCodes.length
  );
}

/** Clears segmenting criteria while preserving the user's query and search field. */
export function clearCompanyFilterSelections(
  state: CompanyFilterState,
): CompanyFilterState {
  return {
    ...state,
    countyCodes: [],
    municipalityCodes: [],
    companyStatusCodes: [],
    companyStateCodes: [],
    employerStatusCodes: [],
    vatStatusCodes: [],
    fTaxStatusCodes: [],
    marketingStatusCodes: [],
    sizeClassCodes: [],
    companyAgeRange: [0, 100],
    postOrt: "",
    postNr: "",
    ownerCategoryCodes: [],
    smeSizeCodes: [],
    exportImportMarks: [],
    sectionCodes: [],
    industryCodes: [],
    industryDetailCodes: [],
    turnoverSizeCodes: [],
  };
}
