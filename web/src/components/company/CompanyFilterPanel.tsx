"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  COUNTY_OPTIONS,
  EMPLOYER_STATUS_OPTIONS,
  EXPORT_IMPORT_OPTIONS,
  F_TAX_STATUS_OPTIONS,
  INDUSTRY_OPTIONS,
  MARKETING_STATUS_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
  OWNER_CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  SME_SIZE_OPTIONS,
  VAT_STATUS_OPTIONS,
} from "@/src/lib/companyFilterOptions";
import {
  COMPANY_STATE_OPTIONS,
  COMPANY_STATUS_OPTIONS,
} from "@/src/lib/companyStatus";
import {
  INDUSTRY_DETAIL_OPTIONS,
  SECTION_OPTIONS,
  TURNOVER_OPTIONS,
} from "@/src/lib/companyAdvancedFilterOptions";
import { ui } from "@/src/lib/uiStyles";
import { FilterChipGroup } from "@/src/components/company/FilterChipGroup";
import {
  NumericFilterCard,
  type NumericFilterMode,
} from "@/src/components/company/NumericFilterCard";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { CountChip } from "@/src/components/ui/Chip";
import { buttonClassName } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { uiMotion } from "@/src/lib/uiMotion";
import {
  AGE_RANGE,
  EMPLOYEE_BUCKETS,
  EMPLOYEE_RANGE,
  TURNOVER_BUCKETS,
  TURNOVER_RANGE,
  bucketValuesForNumericRange,
  isFullNumericRange,
  numericRangeFromSelectedBuckets,
  type NumericRange,
} from "@/src/lib/companyNumericFilters";

type CompanyFilterPanelProps = {
  countyCodes: string[];
  municipalityCodes: string[];
  companyStatusCodes: string[];
  companyStateCodes: string[];
  employerStatusCodes: string[];
  vatStatusCodes: string[];
  fTaxStatusCodes: string[];
  marketingStatusCodes: string[];
  sizeClassCodes: string[];
  companyAgeRange: NumericRange;
  postOrt: string;
  postNr: string;
  ownerCategoryCodes: string[];
  smeSizeCodes: string[];
  exportImportMarks: string[];
  sectionCodes: string[];
  industryCodes: string[];
  industryDetailCodes: string[];
  turnoverSizeCodes: string[];
  onCountyCodesChange: (values: string[]) => void;
  onMunicipalityCodesChange: (values: string[]) => void;
  onCompanyStatusCodesChange: (values: string[]) => void;
  onCompanyStateCodesChange: (values: string[]) => void;
  onEmployerStatusCodesChange: (values: string[]) => void;
  onVatStatusCodesChange: (values: string[]) => void;
  onFTaxStatusCodesChange: (values: string[]) => void;
  onMarketingStatusCodesChange: (values: string[]) => void;
  onSizeClassCodesChange: (values: string[]) => void;
  onCompanyAgeRangeChange: (values: NumericRange) => void;
  onPostOrtChange: (value: string) => void;
  onPostNrChange: (value: string) => void;
  onOwnerCategoryCodesChange: (values: string[]) => void;
  onSmeSizeCodesChange: (values: string[]) => void;
  onExportImportMarksChange: (values: string[]) => void;
  onSectionCodesChange: (values: string[]) => void;
  onIndustryCodesChange: (values: string[]) => void;
  onIndustryDetailCodesChange: (values: string[]) => void;
  onTurnoverSizeCodesChange: (values: string[]) => void;
  selectedCount: number;
  headerAction?: ReactNode;
  actions?: ReactNode;
  persistentActions?: ReactNode;
  embedded?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  stickyHeader?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCollapseComplete?: () => void;
};

function textFilterInputClass() {
  return `${ui.input} min-w-0`;
}

const integerFormatter = new Intl.NumberFormat("sv-SE", {
  maximumFractionDigits: 0,
});

function formatEmployees(value: number) {
  return `${integerFormatter.format(value)}${value >= EMPLOYEE_RANGE[1] ? "+" : ""}`;
}

function formatTurnover(value: number) {
  return `${integerFormatter.format(value)}${value >= TURNOVER_RANGE[1] ? "+" : ""}`;
}

function formatAge(value: number) {
  return `${integerFormatter.format(value)}${value >= AGE_RANGE[1] ? "+" : ""}`;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function hasSameValues(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function sectionForIndustryGroup(code: string) {
  const n = Number(code);
  if (n >= 1 && n <= 3) return "A";
  if (n >= 5 && n <= 9) return "B";
  if (n >= 10 && n <= 33) return "C";
  if (n === 35) return "D";
  if (n >= 36 && n <= 39) return "E";
  if (n >= 41 && n <= 43) return "F";
  if (n >= 46 && n <= 47) return "G";
  if (n >= 49 && n <= 53) return "H";
  if (n >= 55 && n <= 56) return "I";
  if (n >= 58 && n <= 60) return "J";
  if (n >= 61 && n <= 63) return "K";
  if (n >= 64 && n <= 66) return "L";
  if (n === 68) return "M";
  if (n >= 69 && n <= 75) return "N";
  if (n >= 77 && n <= 82) return "O";
  if (n === 84) return "P";
  if (n === 85) return "Q";
  if (n >= 86 && n <= 88) return "R";
  if (n >= 90 && n <= 93) return "S";
  if (n >= 94 && n <= 96) return "T";
  if (n >= 97 && n <= 98) return "U";
  if (n === 99) return "V";
  return "";
}

function detailBelongsToGroups(detailCode: string, groupCodes: string[]) {
  return groupCodes.includes(detailCode.slice(0, 2));
}

function detailBelongsToSections(detailCode: string, sectionCodes: string[]) {
  return sectionCodes.includes(sectionForIndustryGroup(detailCode.slice(0, 2)));
}

export function CompanyFilterPanel({
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
  onCountyCodesChange,
  onMunicipalityCodesChange,
  onCompanyStatusCodesChange,
  onCompanyStateCodesChange,
  onEmployerStatusCodesChange,
  onVatStatusCodesChange,
  onFTaxStatusCodesChange,
  onMarketingStatusCodesChange,
  onSizeClassCodesChange,
  onCompanyAgeRangeChange,
  onPostOrtChange,
  onPostNrChange,
  onOwnerCategoryCodesChange,
  onSmeSizeCodesChange,
  onExportImportMarksChange,
  onSectionCodesChange,
  onIndustryCodesChange,
  onIndustryDetailCodesChange,
  onTurnoverSizeCodesChange,
  selectedCount,
  headerAction,
  actions,
  persistentActions,
  embedded = false,
  defaultOpen = false,
  collapsible = true,
  stickyHeader = false,
  open: controlledOpen,
  onOpenChange,
  onCollapseComplete,
}: CompanyFilterPanelProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const panelOpen = controlledOpen ?? uncontrolledOpen;
  const [countySearch, setCountySearch] = useState("");
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [companyStateSearch, setCompanyStateSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDetailSearch, setIndustryDetailSearch] = useState("");
  const [employeeRange, setEmployeeRange] = useState<NumericRange>(
    numericRangeFromSelectedBuckets(
      EMPLOYEE_BUCKETS,
      sizeClassCodes,
      EMPLOYEE_RANGE,
    ),
  );
  const [turnoverRange, setTurnoverRange] = useState<NumericRange>(
    numericRangeFromSelectedBuckets(
      TURNOVER_BUCKETS,
      turnoverSizeCodes,
      TURNOVER_RANGE,
    ),
  );
  const [ageRange, setAgeRange] = useState<NumericRange>(companyAgeRange);
  const [employeeFilterMode, setEmployeeFilterMode] =
    useState<NumericFilterMode>("range");
  const [turnoverFilterMode, setTurnoverFilterMode] =
    useState<NumericFilterMode>("range");
  const employeeRangeRef = useRef(employeeRange);
  const turnoverRangeRef = useRef(turnoverRange);
  const [postOrtDraft, setPostOrtDraft] = useState(postOrt);
  const [postNrDraft, setPostNrDraft] = useState(postNr);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const exactRange = employeeRangeRef.current;
      const rangeCodes = isFullNumericRange(exactRange, EMPLOYEE_RANGE)
        ? []
        : bucketValuesForNumericRange(EMPLOYEE_BUCKETS, exactRange);

      if (
        employeeFilterMode === "range" &&
        hasSameValues(sizeClassCodes, rangeCodes)
      ) {
        return;
      }

      const nextRange = numericRangeFromSelectedBuckets(
        EMPLOYEE_BUCKETS,
        sizeClassCodes,
        EMPLOYEE_RANGE,
      );
      employeeRangeRef.current = nextRange;
      setEmployeeRange(nextRange);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [employeeFilterMode, sizeClassCodes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const exactRange = turnoverRangeRef.current;
      const rangeCodes = isFullNumericRange(exactRange, TURNOVER_RANGE)
        ? []
        : bucketValuesForNumericRange(TURNOVER_BUCKETS, exactRange);

      if (
        turnoverFilterMode === "range" &&
        hasSameValues(turnoverSizeCodes, rangeCodes)
      ) {
        return;
      }

      const nextRange = numericRangeFromSelectedBuckets(
        TURNOVER_BUCKETS,
        turnoverSizeCodes,
        TURNOVER_RANGE,
      );
      turnoverRangeRef.current = nextRange;
      setTurnoverRange(nextRange);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [turnoverFilterMode, turnoverSizeCodes]);

  useEffect(() => {
    setAgeRange(companyAgeRange);
  }, [companyAgeRange]);

  useEffect(() => {
    setPostOrtDraft(postOrt);
  }, [postOrt]);

  useEffect(() => {
    setPostNrDraft(postNr);
  }, [postNr]);

  const visibleCounties = useMemo(() => {
    const q = countySearch.trim().toLowerCase();
    if (!q) return COUNTY_OPTIONS;

    return COUNTY_OPTIONS.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [countySearch]);

  const visibleMunicipalities = useMemo(() => {
    let options = MUNICIPALITY_OPTIONS;

    if (countyCodes.length > 0) {
      options = options.filter((option) =>
        countyCodes.includes(MUNICIPALITY_TO_COUNTY[option.value]),
      );
    }

    const q = municipalitySearch.trim().toLowerCase();
    if (!q) return options;

    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [countyCodes, municipalitySearch]);

  const visibleIndustries = useMemo(() => {
    let options = INDUSTRY_OPTIONS;

    if (sectionCodes.length > 0) {
      options = options.filter((option) =>
        sectionCodes.includes(sectionForIndustryGroup(option.value)),
      );
    }

    const q = industrySearch.trim().toLowerCase();
    if (!q) return options;

    return options.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [industrySearch, sectionCodes]);

  const visibleCompanyStates = useMemo(() => {
    const q = companyStateSearch.trim().toLowerCase();
    if (!q) return COMPANY_STATE_OPTIONS;

    return COMPANY_STATE_OPTIONS.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [companyStateSearch]);

  const visibleSections = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q) return SECTION_OPTIONS;

    return SECTION_OPTIONS.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [sectionSearch]);

  const visibleIndustryDetails = useMemo(() => {
    let options = INDUSTRY_DETAIL_OPTIONS;

    if (industryCodes.length > 0) {
      options = options.filter((option) =>
        detailBelongsToGroups(option.value, industryCodes),
      );
    } else if (sectionCodes.length > 0) {
      options = options.filter((option) =>
        detailBelongsToSections(option.value, sectionCodes),
      );
    }

    const q = industryDetailSearch.trim().toLowerCase();
    if (!q) return options;

    return options.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [industryCodes, industryDetailSearch, sectionCodes]);

  function commitEmployeeRange(range: NumericRange) {
    onSizeClassCodesChange(
      isFullNumericRange(range, EMPLOYEE_RANGE)
        ? []
        : bucketValuesForNumericRange(EMPLOYEE_BUCKETS, range),
    );
  }

  function updateEmployeeRange(range: NumericRange) {
    employeeRangeRef.current = range;
    setEmployeeRange(range);
  }

  function commitTurnoverRange(range: NumericRange) {
    onTurnoverSizeCodesChange(
      isFullNumericRange(range, TURNOVER_RANGE)
        ? []
        : bucketValuesForNumericRange(TURNOVER_BUCKETS, range),
    );
  }

  function updateTurnoverRange(range: NumericRange) {
    turnoverRangeRef.current = range;
    setTurnoverRange(range);
  }

  function commitAgeRange(range: NumericRange) {
    onCompanyAgeRangeChange(range);
  }

  function commitPostalFilters() {
    if (postOrtDraft !== postOrt) onPostOrtChange(postOrtDraft);
    if (postNrDraft !== postNr) onPostNrChange(postNrDraft);
  }

  function togglePanel() {
    const next = !panelOpen;
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className={embedded ? "" : ui.cardMuted}>
      <div
        className={[
          stickyHeader
            ? [
                ui.stickyHeader,
                "flex flex-col",
                panelOpen ? "border-b border-app-border" : "",
              ].join(" ")
            : "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
          embedded ? "" : ui.panelPadding,
        ].join(" ")}
      >
        <div
          className={[
            "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
            stickyHeader ? "h-7 px-2 lg:h-[26px]" : "",
          ].join(" ")}
        >
          <div className="flex min-w-0 flex-nowrap items-center gap-2">
            <MaskedIcon
              src="/icons/utility/filter.svg"
              className="h-3.5 w-3.5 text-app-text-muted"
            />
            <h2
              className={[
                "hidden shrink-0 whitespace-nowrap text-xs font-semibold text-app-text lg:block",
              ].join(" ")}
            >
              Filter
            </h2>
            <CountChip className="shrink-0 whitespace-nowrap lg:-translate-y-px">
              {selectedCount} valda
            </CountChip>
          </div>

          {headerAction || collapsible ? (
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              {collapsible ? (
                <button
                  type="button"
                  onClick={togglePanel}
                  aria-expanded={panelOpen}
                  aria-label={panelOpen ? "Minimera filter" : "Expandera filter"}
                  title={panelOpen ? "Minimera filter" : "Expandera filter"}
                  className={[
                    buttonClassName({
                      variant: "ghost",
                      size: "icon",
                      className: "h-6 w-6 shrink-0 -translate-y-px p-0 hover:!bg-transparent",
                    }),
                    "hidden lg:inline-flex",
                  ].join(" ")}
                >
                  <ChevronIcon expanded={panelOpen} />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <AnimatedCollapse
          expanded={!collapsible || panelOpen}
          className={
            panelOpen
              ? uiMotion.afterLayoutDesktop
              : uiMotion.immediateDesktop
          }
          allowOverflowWhenExpanded
        >
          <div
            className={[
              "w-full min-w-0 space-y-2.5",
              stickyHeader ? "px-4 pb-4 pt-3" : "",
            ].join(" ")}
          >
            {persistentActions}
            {actions}
          </div>
        </AnimatedCollapse>
      </div>

      <AnimatedCollapse
        expanded={!collapsible || panelOpen}
        className={
          panelOpen
            ? uiMotion.afterLayoutDesktop
            : uiMotion.immediateDesktop
        }
        unmountWhenClosed
        onTransitionComplete={(expanded) => {
          if (!expanded) onCollapseComplete?.();
        }}
      >
        <div
          className={[
            stickyHeader ? "p-4" : "border-t border-app-border",
            embedded || stickyHeader ? "" : ui.panelPadding,
            embedded && !stickyHeader ? "mt-4 pt-4" : "",
          ].join(" ")}
        >
          <div className="space-y-4">
            <FilterChipGroup
              title="Län"
              options={visibleCounties}
              selectedValues={countyCodes}
              onToggle={(value) => {
                const nextCounties = toggleValue(countyCodes, value);
                onCountyCodesChange(nextCounties);

                onMunicipalityCodesChange(
                  nextCounties.length === 0
                    ? []
                    : municipalityCodes.filter((municipalityCode) =>
                        nextCounties.includes(
                          MUNICIPALITY_TO_COUNTY[municipalityCode],
                        ),
                      ),
                );
              }}
              searchable
              searchValue={countySearch}
              onSearchChange={setCountySearch}
              showOptionValues
            />

            <FilterChipGroup
              title="Kommun"
              options={visibleMunicipalities}
              selectedValues={municipalityCodes}
              onToggle={(value) => {
                const nextMunicipalities = toggleValue(
                  municipalityCodes,
                  value,
                );
                onMunicipalityCodesChange(nextMunicipalities);

                const municipalityCounty = MUNICIPALITY_TO_COUNTY[value];
                if (
                  municipalityCounty &&
                  !countyCodes.includes(municipalityCounty)
                ) {
                  onCountyCodesChange([...countyCodes, municipalityCounty]);
                }
              }}
              searchable
              searchValue={municipalitySearch}
              onSearchChange={setMunicipalitySearch}
              emptyText={
                countyCodes.length > 0
                  ? "Inga kommuner matchar din filtrering."
                  : "Välj gärna län först eller sök direkt efter kommun."
              }
            />

            <FilterChipGroup
              title="Verksamhetsstatus"
              options={COMPANY_STATUS_OPTIONS}
              selectedValues={companyStatusCodes}
              onToggle={(value) =>
                onCompanyStatusCodesChange(
                  toggleValue(companyStatusCodes, value),
                )
              }
              showOptionValues
            />

            <FilterChipGroup
              title="Bolagsläge / riskläge"
              options={visibleCompanyStates}
              selectedValues={companyStateCodes}
              onToggle={(value) =>
                onCompanyStateCodesChange(toggleValue(companyStateCodes, value))
              }
              searchable
              searchValue={companyStateSearch}
              onSearchChange={setCompanyStateSearch}
              showOptionValues
            />

            <FilterChipGroup
              title="Arbetsgivarstatus"
              options={EMPLOYER_STATUS_OPTIONS}
              selectedValues={employerStatusCodes}
              onToggle={(value) =>
                onEmployerStatusCodesChange(
                  toggleValue(employerStatusCodes, value),
                )
              }
              showOptionValues
            />

            <FilterChipGroup
              title="Momsstatus"
              options={VAT_STATUS_OPTIONS}
              selectedValues={vatStatusCodes}
              onToggle={(value) =>
                onVatStatusCodesChange(toggleValue(vatStatusCodes, value))
              }
              showOptionValues
            />

            <FilterChipGroup
              title="F-skattstatus"
              options={F_TAX_STATUS_OPTIONS}
              selectedValues={fTaxStatusCodes}
              onToggle={(value) =>
                onFTaxStatusCodesChange(toggleValue(fTaxStatusCodes, value))
              }
              showOptionValues
            />

            <FilterChipGroup
              title="Reklamstatus"
              options={MARKETING_STATUS_OPTIONS}
              selectedValues={marketingStatusCodes}
              onToggle={(value) =>
                onMarketingStatusCodesChange(
                  toggleValue(marketingStatusCodes, value),
                )
              }
              showOptionValues
            />

            <NumericFilterCard
              title="Företagsstorlek"
              value={employeeRange}
              min={EMPLOYEE_RANGE[0]}
              max={EMPLOYEE_RANGE[1]}
              onChange={updateEmployeeRange}
              onCommit={commitEmployeeRange}
              formatValue={formatEmployees}
              unit="anställda"
              scale="logarithmic"
              selectedCount={sizeClassCodes.length}
              mode={employeeFilterMode}
              onModeChange={(nextMode) => {
                if (nextMode === "range") {
                  commitEmployeeRange(employeeRange);
                }
                setEmployeeFilterMode(nextMode);
              }}
              options={SIZE_OPTIONS}
              selectedValues={sizeClassCodes}
              onToggle={(value) =>
                onSizeClassCodesChange(toggleValue(sizeClassCodes, value))
              }
            />

            <NumericFilterCard
              title="Företagsålder"
              value={ageRange}
              min={AGE_RANGE[0]}
              max={AGE_RANGE[1]}
              onChange={setAgeRange}
              onCommit={commitAgeRange}
              formatValue={formatAge}
              unit="år"
              selectedCount={
                companyAgeRange[0] > AGE_RANGE[0] ||
                companyAgeRange[1] < AGE_RANGE[1]
                  ? 1
                  : 0
              }
            />

            <div className={ui.card}>
              <div className="grid gap-3 p-4 md:grid-cols-2 md:items-end">
                <label className="space-y-2">
                  <span className={ui.label}>Postort</span>
                  <input
                    value={postOrtDraft}
                    onChange={(event) => setPostOrtDraft(event.target.value)}
                    onBlur={commitPostalFilters}
                    placeholder="Ex. Stockholm"
                    className={textFilterInputClass()}
                  />
                </label>

                <label className="space-y-2">
                  <span className={ui.label}>Postnummer</span>
                  <input
                    value={postNrDraft}
                    onChange={(event) => setPostNrDraft(event.target.value)}
                    onBlur={commitPostalFilters}
                    placeholder="Ex. 111 eller 11122"
                    className={textFilterInputClass()}
                  />
                </label>
              </div>
            </div>

            <FilterChipGroup
              title="Ägarstruktur"
              options={OWNER_CATEGORY_OPTIONS}
              selectedValues={ownerCategoryCodes}
              onToggle={(value) =>
                onOwnerCategoryCodesChange(
                  toggleValue(ownerCategoryCodes, value),
                )
              }
              showOptionValues
            />

            <FilterChipGroup
              title="SMF-klass"
              options={SME_SIZE_OPTIONS}
              selectedValues={smeSizeCodes}
              onToggle={(value) =>
                onSmeSizeCodesChange(toggleValue(smeSizeCodes, value))
              }
              showOptionValues
            />

            <FilterChipGroup
              title="Export/import"
              options={EXPORT_IMPORT_OPTIONS}
              selectedValues={exportImportMarks}
              onToggle={(value) =>
                onExportImportMarksChange(toggleValue(exportImportMarks, value))
              }
              showOptionValues
            />

            <NumericFilterCard
              title="Omsättning"
              value={turnoverRange}
              min={TURNOVER_RANGE[0]}
              max={TURNOVER_RANGE[1]}
              onChange={updateTurnoverRange}
              onCommit={commitTurnoverRange}
              formatValue={formatTurnover}
              unit="tkr"
              scale="logarithmic"
              selectedCount={turnoverSizeCodes.length}
              mode={turnoverFilterMode}
              onModeChange={(nextMode) => {
                if (nextMode === "range") {
                  commitTurnoverRange(turnoverRange);
                }
                setTurnoverFilterMode(nextMode);
              }}
              options={TURNOVER_OPTIONS}
              selectedValues={turnoverSizeCodes}
              onToggle={(value) =>
                onTurnoverSizeCodesChange(
                  toggleValue(turnoverSizeCodes, value),
                )
              }
            />

            <FilterChipGroup
              title="Avdelning"
              options={visibleSections}
              selectedValues={sectionCodes}
              onToggle={(value) => {
                const nextSections = toggleValue(sectionCodes, value);
                onSectionCodesChange(nextSections);

                const nextIndustries =
                  nextSections.length === 0
                    ? industryCodes
                    : industryCodes.filter((code) =>
                        nextSections.includes(sectionForIndustryGroup(code)),
                      );

                onIndustryCodesChange(nextIndustries);
                onIndustryDetailCodesChange(
                  industryDetailCodes.filter((code) => {
                    if (nextIndustries.length > 0) {
                      return detailBelongsToGroups(code, nextIndustries);
                    }
                    if (nextSections.length > 0) {
                      return detailBelongsToSections(code, nextSections);
                    }
                    return true;
                  }),
                );
              }}
              searchable
              searchValue={sectionSearch}
              onSearchChange={setSectionSearch}
              showOptionValues
            />

            <FilterChipGroup
              title="Branschgrupp"
              options={visibleIndustries}
              selectedValues={industryCodes}
              onToggle={(value) => {
                const nextIndustries = toggleValue(industryCodes, value);
                onIndustryCodesChange(nextIndustries);

                const industrySection = sectionForIndustryGroup(value);
                if (
                  industrySection &&
                  !sectionCodes.includes(industrySection)
                ) {
                  onSectionCodesChange([...sectionCodes, industrySection]);
                }

                onIndustryDetailCodesChange(
                  nextIndustries.length === 0
                    ? industryDetailCodes
                    : industryDetailCodes.filter((code) =>
                        detailBelongsToGroups(code, nextIndustries),
                      ),
                );
              }}
              searchable
              searchValue={industrySearch}
              onSearchChange={setIndustrySearch}
              showOptionValues
            />

            <FilterChipGroup
              title="SNI-kod"
              options={visibleIndustryDetails}
              selectedValues={industryDetailCodes}
              onToggle={(value) => {
                const nextDetails = toggleValue(industryDetailCodes, value);
                onIndustryDetailCodesChange(nextDetails);

                const groupCode = value.slice(0, 2);
                if (!industryCodes.includes(groupCode)) {
                  onIndustryCodesChange([...industryCodes, groupCode]);
                }

                const sectionCode = sectionForIndustryGroup(groupCode);
                if (sectionCode && !sectionCodes.includes(sectionCode)) {
                  onSectionCodesChange([...sectionCodes, sectionCode]);
                }
              }}
              searchable
              searchValue={industryDetailSearch}
              onSearchChange={setIndustryDetailSearch}
              emptyText={
                industryCodes.length > 0
                  ? "Inga SNI-koder matchar valda branschgrupper."
                  : "Sök eller välj en branschgrupp först för en kortare lista."
              }
              showOptionValues
            />
          </div>
        </div>
      </AnimatedCollapse>
    </div>
  );
}
