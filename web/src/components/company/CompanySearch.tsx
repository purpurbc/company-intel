"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CompaniesResponse,
  CompanyMetricSort,
  CompanyNameSort,
  CompanySearchBy,
  ListCompaniesParams,
  SavedSegment,
  SavedSegmentPayload,
} from "@/src/lib/types";
import {
  createSavedSegment,
  listCompanies,
  listSavedSegments,
  recordCompanySearchClick,
  touchSavedSegment,
} from "@/src/lib/api";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { Pagination } from "@/src/components/ui/Pagination";
import { CompanyList } from "@/src/components/company/CompanyList";
import { CompanyFilterPanel } from "@/src/components/company/CompanyFilterPanel";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { SkeletonLine, SkeletonList } from "@/src/components/ui/Skeleton";
import { SavedSegmentDialog } from "@/src/components/profile/SavedSegmentDialog";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ListViewToggle } from "@/src/components/ui/ListViewToggle";
import { Button } from "@/src/components/ui/Button";
import { Feedback } from "@/src/components/ui/Feedback";
import { CountChip } from "@/src/components/ui/Chip";
import { uiMotion } from "@/src/lib/uiMotion";
import {
  readCompanySearchUrl,
  updateCompanySearchUrl,
  type CompanySearchUrlState,
} from "@/src/lib/companySearchUrl";
import {
  COMPANY_PAGE_SIZE_OPTIONS,
  COMPANY_RESULT_WINDOW_LIMIT,
  isCompanyPageSize,
} from "@/src/lib/pagination";
import {
  clearCompanyFilterSelections,
  companyFilterRecordFromState,
  companyFilterStateFromRecord,
  countCompanyFilterSelections,
  type CompanyFilterState,
} from "@/src/lib/companyFilterState";
import {
  COMPANY_METRIC_SORT_OPTIONS,
  COMPANY_NAME_SORT_OPTIONS,
  companyMetricSortValue,
  companyNameSortValue,
} from "@/src/lib/companySearchOptions";

const DASHBOARD_SESSION_KEY = "company-intel-company-search";
// Keep responsive state transitions aligned with Tailwind's `lg` breakpoint.
const DESKTOP_FILTER_MEDIA_QUERY = "(min-width: 1024px)";

type ActiveDashboardSegment = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
};

type PersistedDashboardSearch = CompanyFilterState & {
  limit: number;
  compactList: boolean;
  nameSort: CompanyNameSort;
  metricSort: CompanyMetricSort;
  sort?: string;
  offset: number;
  resultCount: number | null;
  activeSegment?: ActiveDashboardSegment | null;
};

type SearchExecutionOptions = {
  useCompleteResultCache?: boolean;
  knownTotal?: number | null;
  knownTotalKind?: CompaniesResponse["total_kind"];
  skipTotalCount?: boolean;
};

type CompleteResultCache = {
  criteriaKey: string;
  items: CompaniesResponse["items"];
  total: number;
};

// The API may spend 5 seconds on an exact count and then up to 3 seconds on a
// bounded estimate. Keep the browser deadline above that server-side budget so
// a valid estimated response is not aborted during its final fallback.
const COUNT_REQUEST_DEADLINE_MS = 10_000;

const NAME_SORT_MENU_OPTIONS: Array<{
  value: CompanyNameSort;
  label: string;
}> = COMPANY_NAME_SORT_OPTIONS.map((option) => ({
  ...option,
  label: `Namn: ${option.label}`,
}));

function isCompanyNameSort(value: unknown): value is CompanyNameSort {
  return value === "asc" || value === "desc";
}

function isCompanyMetricSort(value: unknown): value is CompanyMetricSort {
  return companyMetricSortValue(value) === value;
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

function savedSegmentSearch(
  segment: SavedSegment,
  compactList: boolean,
): PersistedDashboardSearch {
  const filters = segment.filters ?? {};
  const sort = segment.sort ?? {};
  const numberValue = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const limit = numberValue(sort.limit);

  return {
    ...companyFilterStateFromRecord(filters),
    limit: isCompanyPageSize(limit) ? limit : 50,
    compactList,
    nameSort: companyNameSortValue(sort.name_sort),
    metricSort: companyMetricSortValue(sort.metric_sort),
    offset: 0,
    resultCount: segment.result_count,
    activeSegment: {
      id: segment.id,
      name: segment.name,
      filters: segment.filters ?? {},
      sort: segment.sort ?? {},
    },
  };
}

const SEARCH_EXECUTION_KEYS = new Set([
  "limit",
  "offset",
  "include_total",
  "count_only",
  "search_id",
  "reformulated",
]);

function companySearchCriteriaKey(params: ListCompaniesParams) {
  return stableJson(
    Object.fromEntries(
      Object.entries(params).filter(
        ([key, value]) => !SEARCH_EXECUTION_KEYS.has(key) && value !== undefined,
      ),
    ),
  );
}

function withoutFilters(search: PersistedDashboardSearch): PersistedDashboardSearch {
  return {
    ...search,
    ...clearCompanyFilterSelections(search),
    activeSegment: null,
    offset: 0,
    resultCount: null,
  };
}

function dashboardSearchFromUrl(
  url: CompanySearchUrlState,
  compactList: boolean,
): PersistedDashboardSearch {
  return {
    q: url.q,
    searchBy: url.search_by,
    limit: url.limit,
    compactList,
    countyCodes: url.county_codes,
    municipalityCodes: url.municipality_codes,
    companyStatusCodes: url.company_status_codes,
    companyStateCodes: url.company_state_codes,
    employerStatusCodes: url.employer_status_codes,
    vatStatusCodes: url.vat_status_codes,
    fTaxStatusCodes: url.f_tax_status_codes,
    marketingStatusCodes: url.marketing_status_codes,
    sizeClassCodes: url.size_class_codes,
    companyAgeRange: [url.age_min ?? 0, url.age_max ?? 100],
    postOrt: url.post_ort ?? "",
    postNr: url.post_nr ?? "",
    ownerCategoryCodes: url.owner_category_codes,
    smeSizeCodes: url.sme_size_codes,
    exportImportMarks: url.export_import_marks,
    sectionCodes: url.section_codes,
    industryCodes: url.industry_codes,
    industryDetailCodes: url.industry_detail_codes,
    turnoverSizeCodes: url.turnover_size_codes,
    nameSort: url.name_sort,
    metricSort: url.metric_sort,
    offset: url.offset,
    resultCount: null,
    activeSegment: null,
  };
}

function emptyDashboardSearch(compactList: boolean): PersistedDashboardSearch {
  return dashboardSearchFromUrl(
    {
      q: "",
      search_by: "all",
      name_sort: "asc",
      metric_sort: "none",
      limit: 50,
      offset: 0,
      county_codes: [],
      municipality_codes: [],
      company_status_codes: [],
      company_state_codes: [],
      employer_status_codes: [],
      vat_status_codes: [],
      f_tax_status_codes: [],
      marketing_status_codes: [],
      size_class_codes: [],
      owner_category_codes: [],
      sme_size_codes: [],
      export_import_marks: [],
      section_codes: [],
      industry_codes: [],
      industry_detail_codes: [],
      turnover_size_codes: [],
    },
    compactList,
  );
}

export function CompanySearch() {
  const skipNextAutoSearch = useRef(true);
  const searchRequestId = useRef(0);
  const dataAbortController = useRef<AbortController | null>(null);
  const countAbortController = useRef<AbortController | null>(null);
  const autoSearchTimer = useRef<number | null>(null);
  const countDeadlineTimer = useRef<number | null>(null);
  const mobileFilterCloseTimer = useRef<number | null>(null);
  const compactListRef = useRef(false);
  const activeSearchId = useRef<string | null>(null);
  const completeResultCache = useRef<CompleteResultCache | null>(null);
  const lastExecutedQuery = useRef("");
  const [sessionReady, setSessionReady] = useState(false);
  const [q, setQ] = useState("");
  const [searchBy, setSearchBy] = useState<CompanySearchBy>("all");
  const [limit, setLimit] = useState(50);
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
  const [counting, setCounting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [mobileFiltersMounted, setMobileFiltersMounted] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDraft, setMobileDraft] =
    useState<PersistedDashboardSearch | null>(null);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);
  const [desktopFilterAnchorSticky, setDesktopFilterAnchorSticky] =
    useState(true);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [segmentSaving, setSegmentSaving] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [savedSegmentsLoading, setSavedSegmentsLoading] = useState(true);
  const [savedSegmentsFailed, setSavedSegmentsFailed] = useState(false);
  const [activeSegment, setActiveSegment] =
    useState<ActiveDashboardSegment | null>(null);

  function currentSearchState(): PersistedDashboardSearch {
    return {
      q,
      searchBy,
      limit,
      compactList,
      countyCodes,
      municipalityCodes,
      companyStatusCodes,
      companyStateCodes,
      employerStatusCodes,
      vatStatusCodes,
      fTaxStatusCodes,
      marketingStatusCodes,
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
      offset: data?.offset ?? 0,
      resultCount: data?.total_kind === "exact" ? (data.total ?? null) : null,
      activeSegment,
    };
  }

  const committedSearch = currentSearchState();
  const panelSearch = mobileFiltersOpen && mobileDraft ? mobileDraft : committedSearch;
  // The phone sheet must always expose its contents, independently of the
  // user's persisted desktop collapsed/expanded preference.
  const filterPanelOpen = mobileFiltersMounted || desktopFiltersOpen;
  const selectedFilterCount = countCompanyFilterSelections(committedSearch);
  const panelSelectedFilterCount = countCompanyFilterSelections(panelSearch);

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
        limit: isCompanyPageSize(parsed.limit) ? parsed.limit : 50,
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

  function applyPersistedSearchState(persisted: PersistedDashboardSearch) {
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
  }

  async function search(
    offset = 0,
    overrides: Partial<ListCompaniesParams> = {},
    historyMode: "push" | "replace" | "none" = "push",
    execution: SearchExecutionOptions = {},
  ) {
    if (autoSearchTimer.current !== null) {
      window.clearTimeout(autoSearchTimer.current);
      autoSearchTimer.current = null;
    }
    dataAbortController.current?.abort();
    countAbortController.current?.abort();
    if (countDeadlineTimer.current !== null) {
      window.clearTimeout(countDeadlineTimer.current);
      countDeadlineTimer.current = null;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    const dataController = new AbortController();
    dataAbortController.current = dataController;
    setLoading(true);
    setCounting(false);
    setErr(null);

    try {
      const executedQuery = (overrides.q ?? q).trim().toLocaleLowerCase("sv-SE");
      const searchId = crypto.randomUUID();
      const reformulated =
        lastExecutedQuery.current.length > 0 &&
        executedQuery !== lastExecutedQuery.current;
      activeSearchId.current = searchId;
      lastExecutedQuery.current = executedQuery;
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
        include_total: false,
        search_id: searchId,
        reformulated,
      };
      const criteriaKey = companySearchCriteriaKey(params);

      if (historyMode !== "none") {
        updateCompanySearchUrl(params, offset, historyMode);
      }

      const cached = completeResultCache.current;
      if (
        execution.useCompleteResultCache &&
        cached?.criteriaKey === criteriaKey
      ) {
        const pageSize = params.limit ?? limit;
        const items = cached.items.slice(offset, offset + pageSize);
        setData({
          items,
          total: cached.total,
          total_kind: "exact",
          search_mode: "results",
          has_more: offset + items.length < cached.total,
          limit: pageSize,
          offset,
          result_window_limit: COMPANY_RESULT_WINDOW_LIMIT,
        });
        setCounting(false);
        return;
      }

      const res = await listCompanies(params, { signal: dataController.signal });
      if (searchRequestId.current !== requestId) return;
      const inferredTotal =
        res.search_mode !== "autocomplete" &&
        !res.has_more &&
        res.offset + res.items.length < res.result_window_limit &&
        (res.offset === 0 || res.items.length > 0)
          ? res.offset + res.items.length
          : null;
      const knownTotal =
        inferredTotal ??
        (typeof execution.knownTotal === "number"
          ? execution.knownTotal
          : null);
      const response: CompaniesResponse =
        typeof knownTotal === "number"
          ? {
              ...res,
              total: knownTotal,
              total_kind:
                typeof inferredTotal === "number"
                  ? "exact"
                  : execution.knownTotalKind ?? "exact",
            }
          : res;
      setData(response);

      if (
        res.search_mode === "results" &&
        res.offset === 0 &&
        !res.has_more &&
        typeof inferredTotal === "number"
      ) {
        completeResultCache.current = {
          criteriaKey,
          items: res.items,
          total: inferredTotal,
        };
      }

      if (
        typeof inferredTotal === "number" ||
        res.search_mode === "autocomplete" ||
        (execution.skipTotalCount &&
          typeof execution.knownTotal === "number" &&
          res.items.length > 0)
      ) {
        return;
      }

      setCounting(true);
      const countController = new AbortController();
      countAbortController.current = countController;
      const countDeadline = window.setTimeout(() => {
        countController.abort();
      }, COUNT_REQUEST_DEADLINE_MS);
      countDeadlineTimer.current = countDeadline;

      void listCompanies(
        {
          ...params,
          limit: 1,
          offset: 0,
          include_total: true,
          count_only: true,
        },
        { signal: countController.signal },
      )
        .then((countRes) => {
          if (searchRequestId.current !== requestId) return;
          if (typeof countRes.total !== "number") return;

          if (
            res.search_mode === "results" &&
            res.offset > 0 &&
            res.items.length === 0 &&
            countRes.total_kind === "exact"
          ) {
            const pageSize = params.limit ?? limit;
            const accessibleTotal = Math.min(
              countRes.total,
              countRes.result_window_limit,
            );
            const correctedOffset =
              accessibleTotal > 0
                ? Math.floor((accessibleTotal - 1) / pageSize) * pageSize
                : 0;

            if (correctedOffset !== res.offset) {
              void search(correctedOffset, params, "replace", {
                useCompleteResultCache: true,
                knownTotal: countRes.total,
                knownTotalKind: countRes.total_kind,
                skipTotalCount: true,
              });
              return;
            }
          }

          setData((current) =>
            current && current.offset === res.offset
              ? {
                  ...current,
                  total: countRes.total,
                  total_kind: countRes.total_kind,
                }
              : current,
          );
        })
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(countDeadline);
          if (countDeadlineTimer.current === countDeadline) {
            countDeadlineTimer.current = null;
          }
          if (
            searchRequestId.current === requestId &&
            countAbortController.current === countController
          ) {
            countAbortController.current = null;
            setCounting(false);
          }
        });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (searchRequestId.current !== requestId) return;
      setErr(e instanceof Error ? e.message : "Ett okänt fel uppstod.");
      setCounting(false);
    } finally {
      if (searchRequestId.current === requestId) {
        dataAbortController.current = null;
        setLoading(false);
      }
    }
  }

  function resetFilters() {
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
    if (mobileFiltersOpen && mobileDraft) {
      setMobileDraft(withoutFilters(mobileDraft));
      setConfirmResetOpen(false);
      return;
    }

    skipNextAutoSearch.current = true;
    resetFilters();
    setConfirmResetOpen(false);
    search(0, {
      q,
      search_by: searchBy,
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
      name_sort: nameSort,
      metric_sort: metricSort,
      limit,
    });
  }

  function currentSegmentPayload(
    source: PersistedDashboardSearch = panelSearch,
  ): SavedSegmentPayload {
    return {
      name: "",
      description: "",
      filters: companyFilterRecordFromState(source),
      sort: {
        name_sort: source.nameSort,
        metric_sort: source.metricSort,
        limit: source.limit,
      },
      source: "manual",
      visibility: "private",
      result_count: source.resultCount,
    };
  }

  function currentSegmentSnapshot() {
    const payload = currentSegmentPayload(committedSearch);
    return {
      filters: payload.filters ?? {},
      sort: payload.sort ?? {},
    };
  }

  async function saveCurrentSegment(payload: SavedSegmentPayload) {
    setSegmentSaving(true);
    setSegmentError(null);

    try {
      const created = await createSavedSegment(payload);
      setSavedSegments((current) => [
        created,
        ...current.filter((segment) => segment.id !== created.id),
      ]);
      setSegmentDialogOpen(false);
    } catch (error) {
      setSegmentError(
        error instanceof Error ? error.message : "Kunde inte spara segmentet.",
      );
    } finally {
      setSegmentSaving(false);
    }
  }

  function openSegmentDialog() {
    setSegmentError(null);
    setSegmentDialogOpen(true);
  }

  function createSegmentButton(className = "") {
    return (
      <Button
        type="button"
        onClick={openSegmentDialog}
        variant="accent"
        size="sm"
        disabled={loading || (selectedFilterCount === 0 && !q.trim())}
        className={className}
      >
        Skapa segment
      </Button>
    );
  }

  function selectSavedSegment(segmentId: string) {
    if (!segmentId) return;
    const segment = savedSegments.find((item) => item.id === segmentId);
    if (!segment) return;

    const persisted = savedSegmentSearch(segment, compactList);
    if (mobileFiltersOpen) {
      setMobileDraft(persisted);
      return;
    }

    skipNextAutoSearch.current = true;
    applyPersistedSearchState(persisted);
    void touchSavedSegment(segment.id).catch(() => undefined);
    void search(0, persistedSearchParams(persisted));
  }

  const segmentOptions = [
    {
      value: "",
      label: savedSegmentsLoading
        ? "Laddar segment..."
        : savedSegmentsFailed
          ? "Kunde inte ladda segment"
          : savedSegments.length === 0
            ? "Inga sparade segment"
            : "Välj segment",
    },
    ...(activeSegment &&
    !savedSegments.some((segment) => segment.id === activeSegment.id)
      ? [{
          value: activeSegment.id,
          label: activeSegment.name,
        }]
      : []),
    ...savedSegments.map((segment) => ({
      value: segment.id,
      label: segment.name,
    })),
  ];

  const segmentSelector = (
    <div className="w-full min-w-0 max-w-full [&>div]:w-full [&>div>button]:h-7">
      <SelectMenu
        label=""
        options={segmentOptions}
        value={activeSegment?.id ?? ""}
        onChange={selectSavedSegment}
        align="right"
        mobileAlign="left"
        compact
        textSize="xs"
        searchable
        searchPlaceholder="Sök segment"
        panelWidth="wide"
      />
    </div>
  );

  const filterActions = (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      <Button
        type="button"
        onClick={() => setConfirmResetOpen(true)}
        variant="secondary"
        size="sm"
        disabled={loading || panelSelectedFilterCount === 0}
        className="w-full disabled:border-app-border disabled:bg-app-panel-muted disabled:text-app-text-subtle disabled:opacity-60"
      >
        Rensa filter
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={applyMobileFilters}
        disabled={loading}
        className="w-full lg:hidden"
      >
        Applicera filter
      </Button>
    </div>
  );

  function openMobileFilters() {
    if (mobileFilterCloseTimer.current !== null) {
      window.clearTimeout(mobileFilterCloseTimer.current);
    }

    setMobileDraft(currentSearchState());
    setMobileFiltersMounted(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setMobileFiltersOpen(true));
    });
  }

  function closeMobileFilters() {
    setMobileFiltersOpen(false);
    mobileFilterCloseTimer.current = window.setTimeout(() => {
      setMobileFiltersMounted(false);
      setMobileDraft(null);
      mobileFilterCloseTimer.current = null;
    }, 200);
  }

  function setDesktopFilterVisibility(open: boolean) {
    if (open) setDesktopFilterAnchorSticky(true);
    if (
      !open &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDesktopFilterAnchorSticky(false);
    }
    setDesktopFiltersOpen(open);
  }

  function completeDesktopFilterCollapse() {
    if (!desktopFiltersOpen) setDesktopFilterAnchorSticky(false);
  }

  function applyMobileFilters() {
    if (!mobileDraft) {
      closeMobileFilters();
      return;
    }

    const next = { ...mobileDraft, offset: 0, resultCount: null };
    skipNextAutoSearch.current = true;
    applyPersistedSearchState(next);
    if (next.activeSegment) {
      void touchSavedSegment(next.activeSegment.id).catch(() => undefined);
    }
    void search(0, persistedSearchParams(next));
    closeMobileFilters();
  }

  function updateMobileDraft(patch: Partial<PersistedDashboardSearch>) {
    setMobileDraft((current) => (current ? { ...current, ...patch } : current));
  }

  useEffect(() => {
    if (!mobileFiltersMounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileFilters();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFiltersMounted]);

  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_FILTER_MEDIA_QUERY);

    function leaveMobileFilterMode(event: MediaQueryListEvent) {
      if (!event.matches) return;
      if (mobileFilterCloseTimer.current !== null) {
        window.clearTimeout(mobileFilterCloseTimer.current);
        mobileFilterCloseTimer.current = null;
      }
      setMobileFiltersOpen(false);
      setMobileFiltersMounted(false);
      setMobileDraft(null);
    }

    desktopQuery.addEventListener("change", leaveMobileFilterMode);
    return () => {
      desktopQuery.removeEventListener("change", leaveMobileFilterMode);
    };
  }, []);

  useEffect(
    () => () => {
      if (mobileFilterCloseTimer.current !== null) {
        window.clearTimeout(mobileFilterCloseTimer.current);
      }
      if (autoSearchTimer.current !== null) {
        window.clearTimeout(autoSearchTimer.current);
      }
      if (countDeadlineTimer.current !== null) {
        window.clearTimeout(countDeadlineTimer.current);
      }
      dataAbortController.current?.abort();
      countAbortController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    compactListRef.current = compactList;
  }, [compactList]);

  useEffect(() => {
    let cancelled = false;
    setSavedSegmentsLoading(true);
    setSavedSegmentsFailed(false);

    listSavedSegments()
      .then(({ items }) => {
        if (!cancelled) setSavedSegments(items);
      })
      .catch(() => {
        if (!cancelled) setSavedSegmentsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setSavedSegmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const restoreUrlSearch = () => {
      const url = readCompanySearchUrl(window.location.search);
      const persisted = url
        ? dashboardSearchFromUrl(url, compactListRef.current)
        : emptyDashboardSearch(compactListRef.current);

      skipNextAutoSearch.current = true;
      applyPersistedSearchState(persisted);
      void search(
        persisted.offset,
        persistedSearchParams(persisted),
        "none",
      );
    };

    const timer = window.setTimeout(() => {
      const sessionSearch = readPersistedSearch();
      const urlSearch = readCompanySearchUrl(window.location.search);
      const persisted = urlSearch
        ? dashboardSearchFromUrl(
            urlSearch,
            sessionSearch?.compactList ?? false,
          )
        : sessionSearch;

      if (persisted) {
        applyPersistedSearchState(persisted);
        setSessionReady(true);
        void search(
          persisted.offset,
          persistedSearchParams(persisted),
          urlSearch ? "none" : "replace",
        );
        return;
      }

      setSessionReady(true);
      void search(0, {}, "replace");
    }, 0);

    window.addEventListener("popstate", restoreUrlSearch);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", restoreUrlSearch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offset = data?.offset ?? 0;
  const total = typeof data?.total === "number" ? data.total : null;
  const currentPage = Math.floor(offset / limit) + 1;

  function changePageSize(pageSize: number) {
    if (pageSize === limit) return;
    skipNextAutoSearch.current = true;
    setLimit(pageSize);
    void search(0, { limit: pageSize }, "push", {
      useCompleteResultCache: true,
      knownTotal: total,
      knownTotalKind: data?.total_kind,
      skipTotalCount: total !== null,
    });
  }

  function changePage(page: number) {
    void search((page - 1) * limit, {}, "push", {
      useCompleteResultCache: true,
      knownTotal: total,
      knownTotalKind: data?.total_kind,
      skipTotalCount: total !== null,
    });
  }

  useEffect(() => {
    if (!sessionReady) return;

    if (skipNextAutoSearch.current) {
      skipNextAutoSearch.current = false;
      return;
    }

    autoSearchTimer.current = window.setTimeout(() => {
      autoSearchTimer.current = null;
      void search(0);
    }, 225);

    return () => {
      if (autoSearchTimer.current !== null) {
        window.clearTimeout(autoSearchTimer.current);
        autoSearchTimer.current = null;
      }
    };
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
      resultCount: data?.total_kind === "exact" ? total : null,
      activeSegment,
    };

    sessionStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(persisted));
  }, [
    compactList,
    data?.total_kind,
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
      <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-4 xl:flex-nowrap">
        <SearchBar
          value={q}
          onChange={setQ}
          onSearch={() => search(0)}
          searchBy={searchBy}
          onSearchByChange={setSearchBy}
          loading={loading}
          placeholder="Sök företag"
          className="min-w-0 basis-full max-w-2xl xl:max-w-[34rem] xl:flex-1 xl:basis-auto"
        />

        <div className="flex w-full min-w-0 items-center justify-start gap-2 xl:ml-auto xl:w-auto xl:justify-end">
          <div className="w-56 min-w-0 max-w-[calc(100%-7rem)] sm:w-64 xl:w-52">
            {segmentSelector}
          </div>
          {createSegmentButton("h-7 shrink-0")}
        </div>
      </div>

      <div
        data-testid="company-search-layout"
        className={[
          /*
           * Desktop sequence: close panel content, then widen results. Opening
           * runs in reverse. CSS delays keep layout stable without JS timers.
           */
          "grid max-w-full content-start items-start gap-x-5 overflow-x-clip transition-[grid-template-columns] lg:min-h-[calc(100dvh-2rem)]",
          uiMotion.layout,
          desktopFiltersOpen
            ? `lg:grid-cols-[22rem_minmax(0,1fr)] ${uiMotion.immediateDesktop}`
            : `lg:grid-cols-[15rem_minmax(0,1fr)] ${uiMotion.afterCollapseDesktop}`,
        ].join(" ")}
      >
        <div
          data-testid="company-search-count"
          className="flex min-h-5 min-w-0 items-center justify-end text-sm text-app-text-muted lg:col-start-2 lg:row-start-1 lg:text-right"
          aria-live="polite"
        >
          {data ? (
            data.search_mode === "autocomplete" ? (
              <>Visar {data.items.length} förslag · skriv fler tecken för fullständig sökning</>
            ) : (
              <>
                Visar {data.items.length} {data.items.length === 1 ? "träff" : "träffar"} (offset {data.offset})
                {typeof data.total === "number"
                  ? data.total_kind === "estimated"
                    ? ` av cirka ${data.total.toLocaleString("sv-SE")}`
                    : ` av ${data.total.toLocaleString("sv-SE")}`
                  : !data.has_more
                    ? ` av ${data.offset + data.items.length}`
                    : counting
                      ? " · räknar totalt"
                      : ""}
                {typeof data.total === "number" &&
                data.total > data.result_window_limit
                  ? ` · högst ${data.result_window_limit.toLocaleString("sv-SE")} visas`
                  : ""}
              </>
            )
          ) : (
            <>
              <span className="sr-only">Laddar antal träffar</span>
              <SkeletonLine className="h-3 w-56 max-w-[70vw]" />
            </>
          )}
        </div>

        <div
          data-testid="company-search-toolbar"
          className="mt-3 flex min-w-0 items-center justify-between gap-2 lg:col-start-2 lg:row-start-2 lg:justify-end"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 px-2 lg:hidden"
            onClick={openMobileFilters}
            aria-haspopup="dialog"
            aria-label={`Öppna filter, ${selectedFilterCount} valda`}
          >
            <MaskedIcon src="/icons/utility/filter.svg" className="h-4 w-4" />
            <CountChip className="shrink-0 whitespace-nowrap">
              {selectedFilterCount} valda
            </CountChip>
          </Button>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu
              label="Sortera företag"
              icon={<MaskedIcon src="/icons/menu/sort.svg" className="h-4 w-4" />}
              triggerVariant="ghost"
              triggerClassName="h-7 min-w-7 bg-app-panel-soft px-1.5 shadow-[inset_0_0_0_1px_var(--app-border)] hover:bg-app-panel-hover"
              items={[
                ...COMPANY_METRIC_SORT_OPTIONS.map((option) => ({
                  key: `metric-${option.value}`,
                  label:
                    option.value === "none"
                      ? "Ingen måttsortering"
                      : option.label,
                  active: option.value === metricSort,
                  closeOnSelect: false,
                  onSelect: () => setMetricSort(option.value),
                })),
                ...NAME_SORT_MENU_OPTIONS.map((option, index) => ({
                  key: `name-${option.value}`,
                  label: option.label,
                  active: option.value === nameSort,
                  separatorBefore: index === 0,
                  closeOnSelect: false,
                  onSelect: () => setNameSort(option.value),
                })),
              ]}
            />

            <ListViewToggle
              value={compactList ? "compact" : "card"}
              onChange={(value) => setCompactList(value === "compact")}
              ariaLabel="Visningsläge för företag"
              className="h-7"
            />
          </div>
        </div>

        <div
          data-testid="company-search-results"
          className={[
            "mt-4 min-w-0 space-y-4 transition-[padding-left] lg:col-start-1 lg:col-end-3 lg:row-start-3",
            uiMotion.layout,
            desktopFiltersOpen
              ? `lg:pl-[calc(22rem+1.25rem)] ${uiMotion.immediateDesktop}`
              : `lg:pl-0 ${uiMotion.afterCollapseDesktop}`,
          ].join(" ")}
        >
          {err && <Feedback tone="danger">{err}</Feedback>}

          {loading && !data ? <SkeletonList /> : null}

          {data && (
            <section className="space-y-4">
              <div className="relative" aria-busy={loading}>
                <CompanyList
                  items={data.items}
                  compact={compactList}
                  startIndex={data.offset + 1}
                  onCompanyOpen={(company, position) => {
                    if (!activeSearchId.current) return;
                    void recordCompanySearchClick(
                      activeSearchId.current,
                      company.company_id,
                      position,
                    ).catch(() => undefined);
                  }}
                />
                {loading ? (
                  <div className="absolute inset-0 z-10 flex items-start justify-center rounded-md bg-app-bg/50 pt-4 backdrop-blur-[1px]">
                    <CountChip>Laddar sida…</CountChip>
                  </div>
                ) : null}
              </div>

              {data.search_mode === "results" ? (
                <Pagination
                  currentPage={currentPage}
                  pageSize={limit}
                  pageSizeOptions={COMPANY_PAGE_SIZE_OPTIONS}
                  totalItems={total}
                  hasNextPage={data.has_more}
                  resultWindowLimit={data.result_window_limit}
                  loading={loading}
                  ariaLabel="Resultatsidor"
                  onPageChange={changePage}
                  onPageSizeChange={changePageSize}
                />
              ) : null}
            </section>
          )}
        </div>

        <div
          data-testid="company-filter-anchor"
          className={[
            "contents lg:col-start-1 lg:row-start-2 lg:mt-3 lg:block lg:h-7 lg:self-start",
            desktopFiltersOpen || desktopFilterAnchorSticky
              ? "lg:sticky lg:top-20 lg:z-20"
              : "lg:relative lg:z-0",
          ].join(" ")}
        >
          <aside
            data-testid="company-filter-panel"
            role={mobileFiltersOpen ? "dialog" : undefined}
            aria-modal={mobileFiltersOpen ? "true" : undefined}
            aria-label="Filter"
            className={[
              mobileFiltersMounted
                ? "fixed inset-0 z-50 flex"
                : "hidden",
              mobileFiltersOpen
                ? "translate-y-0"
                : "pointer-events-none translate-y-full",
              "flex-col overflow-hidden bg-app-bg shadow-[var(--app-shadow-panel)] transition-transform duration-200 ease-out will-change-transform lg:pointer-events-auto lg:absolute lg:inset-x-0 lg:top-0 lg:z-auto lg:flex lg:h-auto lg:max-h-[calc(100vh-6rem)] lg:translate-y-0 lg:rounded-md lg:border lg:border-app-border lg:bg-app-panel-soft",
            ].join(" ")}
          >
          <div
            data-testid="company-filter-scroll"
            className={[
              "relative isolate z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain",
              desktopFiltersOpen
                ? ""
                : "lg:overflow-visible",
            ].join(" ")}
          >
            <CompanyFilterPanel
              countyCodes={panelSearch.countyCodes}
              municipalityCodes={panelSearch.municipalityCodes}
              companyStatusCodes={panelSearch.companyStatusCodes}
              companyStateCodes={panelSearch.companyStateCodes}
              employerStatusCodes={panelSearch.employerStatusCodes}
              vatStatusCodes={panelSearch.vatStatusCodes}
              fTaxStatusCodes={panelSearch.fTaxStatusCodes}
              marketingStatusCodes={panelSearch.marketingStatusCodes}
              sizeClassCodes={panelSearch.sizeClassCodes}
              companyAgeRange={panelSearch.companyAgeRange}
              postOrt={panelSearch.postOrt}
              postNr={panelSearch.postNr}
              ownerCategoryCodes={panelSearch.ownerCategoryCodes}
              smeSizeCodes={panelSearch.smeSizeCodes}
              exportImportMarks={panelSearch.exportImportMarks}
              sectionCodes={panelSearch.sectionCodes}
              industryCodes={panelSearch.industryCodes}
              industryDetailCodes={panelSearch.industryDetailCodes}
              turnoverSizeCodes={panelSearch.turnoverSizeCodes}
              onCountyCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ countyCodes: value })
                  : setCountyCodes(value)
              }
              onMunicipalityCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ municipalityCodes: value })
                  : setMunicipalityCodes(value)
              }
              onCompanyStatusCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ companyStatusCodes: value })
                  : setCompanyStatusCodes(value)
              }
              onCompanyStateCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ companyStateCodes: value })
                  : setCompanyStateCodes(value)
              }
              onEmployerStatusCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ employerStatusCodes: value })
                  : setEmployerStatusCodes(value)
              }
              onVatStatusCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ vatStatusCodes: value })
                  : setVatStatusCodes(value)
              }
              onFTaxStatusCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ fTaxStatusCodes: value })
                  : setFTaxStatusCodes(value)
              }
              onMarketingStatusCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ marketingStatusCodes: value })
                  : setMarketingStatusCodes(value)
              }
              onSizeClassCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ sizeClassCodes: value })
                  : setSizeClassCodes(value)
              }
              onCompanyAgeRangeChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ companyAgeRange: value })
                  : setCompanyAgeRange(value)
              }
              onPostOrtChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ postOrt: value })
                  : setPostOrt(value)
              }
              onPostNrChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ postNr: value })
                  : setPostNr(value)
              }
              onOwnerCategoryCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ ownerCategoryCodes: value })
                  : setOwnerCategoryCodes(value)
              }
              onSmeSizeCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ smeSizeCodes: value })
                  : setSmeSizeCodes(value)
              }
              onExportImportMarksChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ exportImportMarks: value })
                  : setExportImportMarks(value)
              }
              onSectionCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ sectionCodes: value })
                  : setSectionCodes(value)
              }
              onIndustryCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ industryCodes: value })
                  : setIndustryCodes(value)
              }
              onIndustryDetailCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ industryDetailCodes: value })
                  : setIndustryDetailCodes(value)
              }
              onTurnoverSizeCodesChange={(value) =>
                mobileFiltersOpen
                  ? updateMobileDraft({ turnoverSizeCodes: value })
                  : setTurnoverSizeCodes(value)
              }
              selectedCount={panelSelectedFilterCount}
              headerAction={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="lg:hidden"
                  onClick={closeMobileFilters}
                >
                  Stäng
                </Button>
              }
              actions={filterActions}
              embedded
              defaultOpen
              collapsible={!mobileFiltersMounted}
              stickyHeader
              open={filterPanelOpen}
              onOpenChange={setDesktopFilterVisibility}
              onCollapseComplete={completeDesktopFilterCollapse}
            />
          </div>

          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Rensa filter?"
        description="Detta tar bort valda filter. Söktext, sortering och antal rader behålls."
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
