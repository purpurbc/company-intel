"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import type {
  CompaniesResponse,
  CompanyMetricSort,
  CompanyNameSort,
  CompanySearchBy,
  ListCompaniesParams,
  SavedSegmentPayload,
} from "@/src/lib/types";
import { createSavedSegment, listCompanies } from "@/src/lib/api";

import { LIMIT_OPTIONS, SearchBar } from "@/src/components/ui/SearchBar";
import { Pagination } from "@/src/components/ui/Pagination";
import { CompanyList } from "@/src/components/company/CompanyList";
import { CompanyFilterPanel } from "@/src/components/company/CompanyFilterPanel";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { SkeletonList } from "@/src/components/ui/Skeleton";
import { SavedSegmentDialog } from "@/src/components/profile/SavedSegmentDialog";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { ToggleButton } from "@/src/components/ui/ToggleButton";

type SearchStatCardProps = {
  label: string;
  value: string;
  sub?: string;
};

const DASHBOARD_SESSION_KEY = "company-intel-company-search";

type ActiveDashboardSegment = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
};

type PersistedDashboardSearch = {
  q: string;
  searchBy: CompanySearchBy;
  limit: number;
  compactList: boolean;
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
  nameSort: CompanyNameSort;
  metricSort: CompanyMetricSort;
  sort?: string;
  offset: number;
  resultCount: number | null;
  activeSegment?: ActiveDashboardSegment | null;
};

const NAME_SORT_OPTIONS: { value: CompanyNameSort; label: string }[] = [
  { value: "asc", label: "A-Ö" },
  { value: "desc", label: "Ö-A" },
];

const METRIC_SORT_OPTIONS: { value: CompanyMetricSort; label: string }[] = [
  { value: "none", label: "Ingen" },
  { value: "turnover_asc", label: "Omsättning stigande" },
  { value: "turnover_desc", label: "Omsättning fallande" },
  { value: "size_asc", label: "Storlek stigande" },
  { value: "size_desc", label: "Storlek fallande" },
];

const LIMIT_MENU_OPTIONS = LIMIT_OPTIONS.map((option) => ({
  value: String(option),
  label: String(option),
}));

function isCompanyNameSort(value: unknown): value is CompanyNameSort {
  return (
    typeof value === "string" &&
    NAME_SORT_OPTIONS.some((option) => option.value === value)
  );
}

function isCompanyMetricSort(value: unknown): value is CompanyMetricSort {
  return (
    typeof value === "string" &&
    METRIC_SORT_OPTIONS.some((option) => option.value === value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readActiveSegment(value: unknown): ActiveDashboardSegment | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    filters: isRecord(value.filters) ? value.filters : {},
    sort: isRecord(value.sort) ? value.sort : {},
  };
}

function stableJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (!isRecord(item)) return item;
    return Object.keys(item)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = item[key];
        return acc;
      }, {});
  });
}

function SearchStatCard({ label, value, sub }: SearchStatCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function SearchHeader({
  total,
  visible,
}: {
  total: number | null;
  visible: number;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Företagssök
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
            Sök företag
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Hitta, filtrera och spara relevanta företag som segment.
          </p>
        </div>

        <div className="grid gap-3 sm:min-w-72">
          <SearchStatCard
            label="Matchande företag"
            value={total === null ? "-" : total.toLocaleString("sv-SE")}
            sub={`${visible} visas just nu`}
          />
        </div>
      </div>
    </section>
  );
}

function SearchWorkspace({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Prospektering
        </p>
        <h2 className="text-lg font-semibold text-slate-100">
          Sök & filtrera
        </h2>
      </div>
      {children}
    </section>
  );
}

export function CompanySearch() {
  const skipNextAutoSearch = useRef(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [q, setQ] = useState("");
  const [searchBy, setSearchBy] = useState<CompanySearchBy>("all");
  const [limit, setLimit] = useState(100);
  const [compactList, setCompactList] = useState(false);
  const [nameSort, setNameSort] = useState<CompanyNameSort>("asc");
  const [metricSort, setMetricSort] = useState<CompanyMetricSort>("none");

  const [countyCodes, setCountyCodes] = useState<string[]>([]);
  const [municipalityCodes, setMunicipalityCodes] = useState<string[]>([]);
  const [companyStatusCodes, setCompanyStatusCodes] = useState<string[]>([]);
  const [companyStateCodes, setCompanyStateCodes] = useState<string[]>([]);
  const [employerStatusCodes, setEmployerStatusCodes] = useState<string[]>([]);
  const [vatStatusCodes, setVatStatusCodes] = useState<string[]>([]);
  const [fTaxStatusCodes, setFTaxStatusCodes] = useState<string[]>([]);
  const [marketingStatusCodes, setMarketingStatusCodes] = useState<string[]>([]);
  const [sizeClassCodes, setSizeClassCodes] = useState<string[]>([]);
  const [companyAgeRange, setCompanyAgeRange] = useState<[number, number]>([
    0, 100,
  ]);
  const [postOrt, setPostOrt] = useState("");
  const [postNr, setPostNr] = useState("");
  const [ownerCategoryCodes, setOwnerCategoryCodes] = useState<string[]>([]);
  const [smeSizeCodes, setSmeSizeCodes] = useState<string[]>([]);
  const [exportImportMarks, setExportImportMarks] = useState<string[]>([]);
  const [sectionCodes, setSectionCodes] = useState<string[]>([]);
  const [industryCodes, setIndustryCodes] = useState<string[]>([]);
  const [industryDetailCodes, setIndustryDetailCodes] = useState<string[]>([]);
  const [turnoverSizeCodes, setTurnoverSizeCodes] = useState<string[]>([]);

  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [segmentSaving, setSegmentSaving] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] =
    useState<ActiveDashboardSegment | null>(null);

  function persistedSearchParams(
    persisted: PersistedDashboardSearch,
  ): Partial<ListCompaniesParams> {
    return {
      q: persisted.q,
      search_by: persisted.searchBy,
      county_codes:
        persisted.countyCodes.length > 0 ? persisted.countyCodes : undefined,
      municipality_codes:
        persisted.municipalityCodes.length > 0
          ? persisted.municipalityCodes
          : undefined,
      company_status_codes:
        persisted.companyStatusCodes.length > 0
          ? persisted.companyStatusCodes
          : undefined,
      company_state_codes:
        persisted.companyStateCodes.length > 0
          ? persisted.companyStateCodes
          : undefined,
      employer_status_codes:
        persisted.employerStatusCodes.length > 0
          ? persisted.employerStatusCodes
          : undefined,
      vat_status_codes:
        persisted.vatStatusCodes.length > 0
          ? persisted.vatStatusCodes
          : undefined,
      f_tax_status_codes:
        persisted.fTaxStatusCodes.length > 0
          ? persisted.fTaxStatusCodes
          : undefined,
      marketing_status_codes:
        persisted.marketingStatusCodes.length > 0
          ? persisted.marketingStatusCodes
          : undefined,
      size_class_codes:
        persisted.sizeClassCodes.length > 0
          ? persisted.sizeClassCodes
          : undefined,
      age_min:
        persisted.companyAgeRange[0] > 0 ? persisted.companyAgeRange[0] : undefined,
      age_max:
        persisted.companyAgeRange[1] < 100
          ? persisted.companyAgeRange[1]
          : undefined,
      post_ort: persisted.postOrt || undefined,
      post_nr: persisted.postNr || undefined,
      owner_category_codes:
        persisted.ownerCategoryCodes.length > 0
          ? persisted.ownerCategoryCodes
          : undefined,
      sme_size_codes:
        persisted.smeSizeCodes.length > 0 ? persisted.smeSizeCodes : undefined,
      export_import_marks:
        persisted.exportImportMarks.length > 0
          ? persisted.exportImportMarks
          : undefined,
      section_codes:
        persisted.sectionCodes.length > 0 ? persisted.sectionCodes : undefined,
      industry_codes:
        persisted.industryCodes.length > 0
          ? persisted.industryCodes
          : undefined,
      industry_detail_codes:
        persisted.industryDetailCodes.length > 0
          ? persisted.industryDetailCodes
          : undefined,
      turnover_size_codes:
        persisted.turnoverSizeCodes.length > 0
          ? persisted.turnoverSizeCodes
          : undefined,
      name_sort: persisted.nameSort,
      metric_sort: persisted.metricSort,
      limit: persisted.limit,
    };
  }

  function readPersistedSearch(): PersistedDashboardSearch | null {
    try {
      const raw = sessionStorage.getItem(DASHBOARD_SESSION_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<PersistedDashboardSearch>;
      if (!parsed || typeof parsed !== "object") return null;

      return {
        q: typeof parsed.q === "string" ? parsed.q : "",
        searchBy:
          parsed.searchBy === "company_name" ||
          parsed.searchBy === "org_nr" ||
          parsed.searchBy === "all"
            ? parsed.searchBy
            : "all",
        limit: typeof parsed.limit === "number" ? parsed.limit : 100,
        compactList: Boolean(parsed.compactList),
        nameSort: isCompanyNameSort(parsed.nameSort)
          ? parsed.nameSort
          : parsed.sort === "name_desc"
            ? "desc"
            : "asc",
        metricSort: isCompanyMetricSort(parsed.metricSort)
          ? parsed.metricSort
          : isCompanyMetricSort(parsed.sort)
            ? parsed.sort
            : "none",
        countyCodes: Array.isArray(parsed.countyCodes)
          ? parsed.countyCodes.filter((value) => typeof value === "string")
          : [],
        municipalityCodes: Array.isArray(parsed.municipalityCodes)
          ? parsed.municipalityCodes.filter((value) => typeof value === "string")
          : [],
        companyStatusCodes: Array.isArray(parsed.companyStatusCodes)
          ? parsed.companyStatusCodes.filter((value) => typeof value === "string")
          : [],
        companyStateCodes: Array.isArray(parsed.companyStateCodes)
          ? parsed.companyStateCodes.filter((value) => typeof value === "string")
          : [],
        employerStatusCodes: Array.isArray(parsed.employerStatusCodes)
          ? parsed.employerStatusCodes.filter(
              (value) => typeof value === "string",
            )
          : [],
        vatStatusCodes: Array.isArray(parsed.vatStatusCodes)
          ? parsed.vatStatusCodes.filter((value) => typeof value === "string")
          : [],
        fTaxStatusCodes: Array.isArray(parsed.fTaxStatusCodes)
          ? parsed.fTaxStatusCodes.filter((value) => typeof value === "string")
          : [],
        marketingStatusCodes: Array.isArray(parsed.marketingStatusCodes)
          ? parsed.marketingStatusCodes.filter(
              (value) => typeof value === "string",
            )
          : [],
        sizeClassCodes: Array.isArray(parsed.sizeClassCodes)
          ? parsed.sizeClassCodes.filter((value) => typeof value === "string")
          : [],
        companyAgeRange:
          Array.isArray(parsed.companyAgeRange) &&
          typeof parsed.companyAgeRange[0] === "number" &&
          typeof parsed.companyAgeRange[1] === "number"
            ? [parsed.companyAgeRange[0], parsed.companyAgeRange[1]]
            : [0, 100],
        postOrt: typeof parsed.postOrt === "string" ? parsed.postOrt : "",
        postNr: typeof parsed.postNr === "string" ? parsed.postNr : "",
        ownerCategoryCodes: Array.isArray(parsed.ownerCategoryCodes)
          ? parsed.ownerCategoryCodes.filter(
              (value) => typeof value === "string",
            )
          : [],
        smeSizeCodes: Array.isArray(parsed.smeSizeCodes)
          ? parsed.smeSizeCodes.filter((value) => typeof value === "string")
          : [],
        exportImportMarks: Array.isArray(parsed.exportImportMarks)
          ? parsed.exportImportMarks.filter((value) => typeof value === "string")
          : [],
        sectionCodes: Array.isArray(parsed.sectionCodes)
          ? parsed.sectionCodes.filter((value) => typeof value === "string")
          : [],
        industryCodes: Array.isArray(parsed.industryCodes)
          ? parsed.industryCodes.filter((value) => typeof value === "string")
          : [],
        industryDetailCodes: Array.isArray(parsed.industryDetailCodes)
          ? parsed.industryDetailCodes.filter(
              (value) => typeof value === "string",
            )
          : [],
        turnoverSizeCodes: Array.isArray(parsed.turnoverSizeCodes)
          ? parsed.turnoverSizeCodes.filter((value) => typeof value === "string")
          : [],
        offset: typeof parsed.offset === "number" ? parsed.offset : 0,
        resultCount:
          typeof parsed.resultCount === "number" ? parsed.resultCount : null,
        activeSegment: readActiveSegment(parsed.activeSegment),
      };
    } catch {
      return null;
    }
  }

  async function search(offset = 0, overrides: Partial<ListCompaniesParams> = {}) {
    setLoading(true);
    setErr(null);

    try {
      const params: ListCompaniesParams = {
        q: overrides.q ?? q,
        search_by: overrides.search_by ?? searchBy,
        county_codes:
          "county_codes" in overrides
            ? overrides.county_codes
            : countyCodes.length > 0
              ? countyCodes
              : undefined,
        municipality_codes:
          "municipality_codes" in overrides
            ? overrides.municipality_codes
            : municipalityCodes.length > 0
              ? municipalityCodes
              : undefined,
        company_status_codes:
          "company_status_codes" in overrides
            ? overrides.company_status_codes
            : companyStatusCodes.length > 0
              ? companyStatusCodes
              : undefined,
        company_state_codes:
          "company_state_codes" in overrides
            ? overrides.company_state_codes
            : companyStateCodes.length > 0
              ? companyStateCodes
              : undefined,
        employer_status_codes:
          "employer_status_codes" in overrides
            ? overrides.employer_status_codes
            : employerStatusCodes.length > 0
              ? employerStatusCodes
              : undefined,
        vat_status_codes:
          "vat_status_codes" in overrides
            ? overrides.vat_status_codes
            : vatStatusCodes.length > 0
              ? vatStatusCodes
              : undefined,
        f_tax_status_codes:
          "f_tax_status_codes" in overrides
            ? overrides.f_tax_status_codes
            : fTaxStatusCodes.length > 0
              ? fTaxStatusCodes
              : undefined,
        marketing_status_codes:
          "marketing_status_codes" in overrides
            ? overrides.marketing_status_codes
            : marketingStatusCodes.length > 0
              ? marketingStatusCodes
              : undefined,
        size_class_codes:
          "size_class_codes" in overrides
            ? overrides.size_class_codes
            : sizeClassCodes.length > 0
              ? sizeClassCodes
              : undefined,
        age_min:
          "age_min" in overrides
            ? overrides.age_min
            : companyAgeRange[0] > 0
              ? companyAgeRange[0]
              : undefined,
        age_max:
          "age_max" in overrides
            ? overrides.age_max
            : companyAgeRange[1] < 100
              ? companyAgeRange[1]
              : undefined,
        post_ort:
          "post_ort" in overrides
            ? overrides.post_ort
            : postOrt.trim() || undefined,
        post_nr:
          "post_nr" in overrides
            ? overrides.post_nr
            : postNr.trim() || undefined,
        owner_category_codes:
          "owner_category_codes" in overrides
            ? overrides.owner_category_codes
            : ownerCategoryCodes.length > 0
              ? ownerCategoryCodes
              : undefined,
        sme_size_codes:
          "sme_size_codes" in overrides
            ? overrides.sme_size_codes
            : smeSizeCodes.length > 0
              ? smeSizeCodes
              : undefined,
        export_import_marks:
          "export_import_marks" in overrides
            ? overrides.export_import_marks
            : exportImportMarks.length > 0
              ? exportImportMarks
              : undefined,
        section_codes:
          "section_codes" in overrides
            ? overrides.section_codes
            : sectionCodes.length > 0
              ? sectionCodes
              : undefined,
        industry_codes:
          "industry_codes" in overrides
            ? overrides.industry_codes
            : industryCodes.length > 0
              ? industryCodes
              : undefined,
        industry_detail_codes:
          "industry_detail_codes" in overrides
            ? overrides.industry_detail_codes
            : industryDetailCodes.length > 0
              ? industryDetailCodes
              : undefined,
        turnover_size_codes:
          "turnover_size_codes" in overrides
            ? overrides.turnover_size_codes
            : turnoverSizeCodes.length > 0
              ? turnoverSizeCodes
              : undefined,
        name_sort: overrides.name_sort ?? nameSort,
        metric_sort: overrides.metric_sort ?? metricSort,
        limit: overrides.limit ?? limit,
        offset,
      };

      const res = await listCompanies(params);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ("");
    setSearchBy("all");
    setLimit(100);
    setNameSort("asc");
    setMetricSort("none");
    setCountyCodes([]);
    setMunicipalityCodes([]);
    setCompanyStatusCodes([]);
    setCompanyStateCodes([]);
    setEmployerStatusCodes([]);
    setVatStatusCodes([]);
    setFTaxStatusCodes([]);
    setMarketingStatusCodes([]);
    setSizeClassCodes([]);
    setCompanyAgeRange([0, 100]);
    setPostOrt("");
    setPostNr("");
    setOwnerCategoryCodes([]);
    setSmeSizeCodes([]);
    setExportImportMarks([]);
    setSectionCodes([]);
    setIndustryCodes([]);
    setIndustryDetailCodes([]);
    setTurnoverSizeCodes([]);
    setActiveSegment(null);
  }

  function resetFiltersAndSearch() {
    skipNextAutoSearch.current = true;
    resetFilters();
    setConfirmResetOpen(false);
    search(0, {
      q: "",
      search_by: "all",
      county_codes: undefined,
      municipality_codes: undefined,
      company_status_codes: undefined,
      company_state_codes: undefined,
      employer_status_codes: undefined,
      vat_status_codes: undefined,
      f_tax_status_codes: undefined,
      marketing_status_codes: undefined,
      size_class_codes: undefined,
      age_min: undefined,
      age_max: undefined,
      post_ort: undefined,
      post_nr: undefined,
      owner_category_codes: undefined,
      sme_size_codes: undefined,
      export_import_marks: undefined,
      section_codes: undefined,
      industry_codes: undefined,
      industry_detail_codes: undefined,
      turnover_size_codes: undefined,
      name_sort: "asc",
      metric_sort: "none",
      limit: 100,
    });
  }

  function currentSegmentPayload(): SavedSegmentPayload {
    return {
      name: "",
      description: "",
      filters: {
        q: q.trim(),
        search_by: searchBy,
        county_codes: countyCodes,
        municipality_codes: municipalityCodes,
        company_status_codes: companyStatusCodes,
        company_state_codes: companyStateCodes,
        employer_status_codes: employerStatusCodes,
        vat_status_codes: vatStatusCodes,
        f_tax_status_codes: fTaxStatusCodes,
        marketing_status_codes: marketingStatusCodes,
        size_class_codes: sizeClassCodes,
        age_min: companyAgeRange[0] > 0 ? companyAgeRange[0] : null,
        age_max: companyAgeRange[1] < 100 ? companyAgeRange[1] : null,
        post_ort: postOrt.trim(),
        post_nr: postNr.trim(),
        owner_category_codes: ownerCategoryCodes,
        sme_size_codes: smeSizeCodes,
        export_import_marks: exportImportMarks,
        section_codes: sectionCodes,
        industry_codes: industryCodes,
        industry_detail_codes: industryDetailCodes,
        turnover_size_codes: turnoverSizeCodes,
      },
      sort: {
        name_sort: nameSort,
        metric_sort: metricSort,
        limit,
      },
      source: "manual",
      visibility: "private",
      result_count: total,
    };
  }

  function currentSegmentSnapshot() {
    const payload = currentSegmentPayload();
    return {
      filters: payload.filters ?? {},
      sort: payload.sort ?? {},
    };
  }

  async function saveCurrentSegment(payload: SavedSegmentPayload) {
    setSegmentSaving(true);
    setSegmentError(null);

    try {
      await createSavedSegment(payload);
      setSegmentDialogOpen(false);
    } catch (error) {
      setSegmentError(
        error instanceof Error ? error.message : "Kunde inte spara segmentet.",
      );
    } finally {
      setSegmentSaving(false);
    }
  }

  const filterActions = (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setConfirmResetOpen(true)}
        className="rounded-md border border-app-border-strong bg-app-panel px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-panel-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
      >
        Rensa
      </button>
    </div>
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const persisted = readPersistedSearch();

      if (persisted) {
        setQ(persisted.q);
        setSearchBy(persisted.searchBy);
        setLimit(persisted.limit);
        setCompactList(persisted.compactList);
        setNameSort(persisted.nameSort);
        setMetricSort(persisted.metricSort);
        setCountyCodes(persisted.countyCodes);
        setMunicipalityCodes(persisted.municipalityCodes);
        setCompanyStatusCodes(persisted.companyStatusCodes);
        setCompanyStateCodes(persisted.companyStateCodes);
        setEmployerStatusCodes(persisted.employerStatusCodes);
        setVatStatusCodes(persisted.vatStatusCodes);
        setFTaxStatusCodes(persisted.fTaxStatusCodes);
        setMarketingStatusCodes(persisted.marketingStatusCodes);
        setSizeClassCodes(persisted.sizeClassCodes);
        setCompanyAgeRange(persisted.companyAgeRange);
        setPostOrt(persisted.postOrt);
        setPostNr(persisted.postNr);
        setOwnerCategoryCodes(persisted.ownerCategoryCodes);
        setSmeSizeCodes(persisted.smeSizeCodes);
        setExportImportMarks(persisted.exportImportMarks);
        setSectionCodes(persisted.sectionCodes);
        setIndustryCodes(persisted.industryCodes);
        setIndustryDetailCodes(persisted.industryDetailCodes);
        setTurnoverSizeCodes(persisted.turnoverSizeCodes);
        setActiveSegment(persisted.activeSegment ?? null);
        setSessionReady(true);
        search(persisted.offset, persistedSearchParams(persisted));
        return;
      }

      setSessionReady(true);
      search(0);
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offset = data?.offset ?? 0;
  const itemCount = data?.items?.length ?? 0;
  const total = typeof data?.total === "number" ? data.total : null;
  const canPrev = offset > 0;
  const canNext = itemCount === limit && limit > 0;

  useEffect(() => {
    if (!sessionReady) return;

    if (skipNextAutoSearch.current) {
      skipNextAutoSearch.current = false;
      return;
    }

    search(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companyAgeRange,
    companyStatusCodes,
    companyStateCodes,
    countyCodes,
    employerStatusCodes,
    exportImportMarks,
    fTaxStatusCodes,
    industryCodes,
    industryDetailCodes,
    limit,
    municipalityCodes,
    nameSort,
    metricSort,
    marketingStatusCodes,
    ownerCategoryCodes,
    postNr,
    postOrt,
    sectionCodes,
    sessionReady,
    sizeClassCodes,
    smeSizeCodes,
    turnoverSizeCodes,
    vatStatusCodes,
  ]);

  useEffect(() => {
    if (!sessionReady || !activeSegment) return;

    const snapshot = currentSegmentSnapshot();
    const matches =
      stableJson(snapshot.filters) === stableJson(activeSegment.filters) &&
      stableJson(snapshot.sort) === stableJson(activeSegment.sort);

    if (!matches) setActiveSegment(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSegment,
    companyAgeRange,
    companyStatusCodes,
    companyStateCodes,
    countyCodes,
    employerStatusCodes,
    exportImportMarks,
    fTaxStatusCodes,
    industryCodes,
    industryDetailCodes,
    limit,
    marketingStatusCodes,
    metricSort,
    municipalityCodes,
    nameSort,
    ownerCategoryCodes,
    postNr,
    postOrt,
    q,
    searchBy,
    sectionCodes,
    sessionReady,
    sizeClassCodes,
    smeSizeCodes,
    turnoverSizeCodes,
    vatStatusCodes,
  ]);

  useEffect(() => {
    if (!sessionReady) return;

    const persisted: PersistedDashboardSearch = {
      q,
      searchBy,
      limit,
      compactList,
      companyStatusCodes,
      companyStateCodes,
      employerStatusCodes,
      vatStatusCodes,
      fTaxStatusCodes,
      marketingStatusCodes,
      countyCodes,
      municipalityCodes,
      sizeClassCodes,
      companyAgeRange,
      postOrt,
      postNr,
      ownerCategoryCodes,
      smeSizeCodes,
      exportImportMarks,
      sectionCodes,
      industryCodes,
      industryDetailCodes,
      turnoverSizeCodes,
      nameSort,
      metricSort,
      offset,
      resultCount: total,
      activeSegment,
    };

    sessionStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(persisted));
  }, [
    compactList,
    activeSegment,
    companyAgeRange,
    companyStatusCodes,
    companyStateCodes,
    countyCodes,
    employerStatusCodes,
    exportImportMarks,
    fTaxStatusCodes,
    industryCodes,
    industryDetailCodes,
    limit,
    marketingStatusCodes,
    metricSort,
    municipalityCodes,
    nameSort,
    offset,
    ownerCategoryCodes,
    postNr,
    postOrt,
    q,
    searchBy,
    sectionCodes,
    sessionReady,
    sizeClassCodes,
    smeSizeCodes,
    turnoverSizeCodes,
    total,
    vatStatusCodes,
  ]);

  return (
    <div className="space-y-5">
      <SearchHeader
        total={total}
        visible={itemCount}
      />

      <SearchWorkspace>
        <SearchBar
          value={q}
          onChange={setQ}
          onSearch={() => search(0)}
          searchBy={searchBy}
          onSearchByChange={setSearchBy}
          loading={loading}
          placeholder="Sök företag"
        >
          <div className="mb-4 flex flex-col gap-3 rounded-md border border-app-border bg-app-panel-soft p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-app-text">
                  Spara aktuellt urval
                </div>
                {activeSegment ? (
                  <a
                    href="/profile"
                    className="rounded-md border border-app-accent-border bg-app-accent-bg px-2 py-1 text-xs font-medium text-app-accent-text transition hover:bg-app-panel-hover"
                  >
                    Aktivt segment: {activeSegment.name}
                  </a>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-app-text-subtle">
                Sparar söktext, filter, sortering och ungefärligt antal träffar.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSegmentError(null);
                setSegmentDialogOpen(true);
              }}
              className="rounded-md border border-app-border-strong bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-panel-hover"
            >
              Spara segment
            </button>
          </div>

          <CompanyFilterPanel
            countyCodes={countyCodes}
            municipalityCodes={municipalityCodes}
            companyStatusCodes={companyStatusCodes}
            companyStateCodes={companyStateCodes}
            employerStatusCodes={employerStatusCodes}
            vatStatusCodes={vatStatusCodes}
            fTaxStatusCodes={fTaxStatusCodes}
            marketingStatusCodes={marketingStatusCodes}
            sizeClassCodes={sizeClassCodes}
            companyAgeRange={companyAgeRange}
            postOrt={postOrt}
            postNr={postNr}
            ownerCategoryCodes={ownerCategoryCodes}
            smeSizeCodes={smeSizeCodes}
            exportImportMarks={exportImportMarks}
            sectionCodes={sectionCodes}
            industryCodes={industryCodes}
            industryDetailCodes={industryDetailCodes}
            turnoverSizeCodes={turnoverSizeCodes}
            onCountyCodesChange={setCountyCodes}
            onMunicipalityCodesChange={setMunicipalityCodes}
            onCompanyStatusCodesChange={setCompanyStatusCodes}
            onCompanyStateCodesChange={setCompanyStateCodes}
            onEmployerStatusCodesChange={setEmployerStatusCodes}
            onVatStatusCodesChange={setVatStatusCodes}
            onFTaxStatusCodesChange={setFTaxStatusCodes}
            onMarketingStatusCodesChange={setMarketingStatusCodes}
            onSizeClassCodesChange={setSizeClassCodes}
            onCompanyAgeRangeChange={setCompanyAgeRange}
            onPostOrtChange={setPostOrt}
            onPostNrChange={setPostNr}
            onOwnerCategoryCodesChange={setOwnerCategoryCodes}
            onSmeSizeCodesChange={setSmeSizeCodes}
            onExportImportMarksChange={setExportImportMarks}
            onSectionCodesChange={setSectionCodes}
            onIndustryCodesChange={setIndustryCodes}
            onIndustryDetailCodesChange={setIndustryDetailCodes}
            onTurnoverSizeCodesChange={setTurnoverSizeCodes}
            actions={filterActions}
            embedded
          />
        </SearchBar>
      </SearchWorkspace>

      {err && (
        <div className="rounded-md border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
          {err}
        </div>
      )}

      {loading && !data ? <SkeletonList /> : null}

      {data && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lead Cards
              </p>
              <h2 className="text-lg font-semibold text-slate-100">
                Alla träffar
              </h2>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <div className="text-sm text-slate-400">
                Visar {data.items.length} träffar (offset {data.offset})
                {typeof data.total === "number" ? ` av ${data.total}` : ""}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <SelectMenu
                  label="Namn"
                  options={NAME_SORT_OPTIONS}
                  value={nameSort}
                  onChange={setNameSort}
                  compact
                />
                <SelectMenu
                  label="Sortera"
                  options={METRIC_SORT_OPTIONS}
                  value={metricSort}
                  onChange={setMetricSort}
                  compact
                />

                <SelectMenu
                  label="Rader"
                  options={LIMIT_MENU_OPTIONS}
                  value={String(limit)}
                  onChange={(value) => setLimit(Number(value))}
                  compact
                />

                <ToggleButton
                  value={compactList ? "compact" : "card"}
                  options={[
                    { value: "card", label: "Kort" },
                    { value: "compact", label: "Kompakt" },
                  ]}
                  onChange={(value) => setCompactList(value === "compact")}
                  ariaLabel="Visningsläge för företag"
                />
              </div>
            </div>
          </div>

          <CompanyList
            items={data.items}
            compact={compactList}
            startIndex={data.offset + 1}
          />

          {loading ? <SkeletonList rows={3} /> : null}

          <Pagination
            canPrev={canPrev}
            canNext={canNext}
            loading={loading}
            onPrev={() => search(offset - limit)}
            onNext={() => search(offset + limit)}
          />
        </section>
      )}

      <ConfirmDialog
        open={confirmResetOpen}
        title="Rensa filter?"
        description="Detta tar bort söktext, valda filter och återställer antal rader per sida."
        confirmLabel="Rensa filter"
        cancelLabel="Behåll"
        tone="danger"
        onConfirm={resetFiltersAndSearch}
        onCancel={() => setConfirmResetOpen(false)}
      />

      <SavedSegmentDialog
        open={segmentDialogOpen}
        mode="create"
        initialPayload={currentSegmentPayload()}
        saving={segmentSaving}
        error={segmentError}
        onCancel={() => setSegmentDialogOpen(false)}
        onSave={saveCurrentSegment}
      />
    </div>
  );
}
