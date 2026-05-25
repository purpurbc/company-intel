"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  COUNTY_OPTIONS,
  INDUSTRY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
  SIZE_OPTIONS,
} from "@/src/lib/companyFilterOptions";
import {
  INDUSTRY_DETAIL_OPTIONS,
  SECTION_OPTIONS,
  TURNOVER_OPTIONS,
} from "@/src/lib/companyAdvancedFilterOptions";
import { ui } from "@/src/lib/uiStyles";
import { FilterChipGroup } from "@/src/components/company/FilterChipGroup";

type RangeValue = [number, number];
type RangeBucket = { value: string; label: string; min: number; max: number };

type CompanyFilterPanelProps = {
  countyCodes: string[];
  municipalityCodes: string[];
  sizeClassCodes: string[];
  sectionCodes: string[];
  industryCodes: string[];
  industryDetailCodes: string[];
  turnoverSizeCodes: string[];
  onCountyCodesChange: (values: string[]) => void;
  onMunicipalityCodesChange: (values: string[]) => void;
  onSizeClassCodesChange: (values: string[]) => void;
  onSectionCodesChange: (values: string[]) => void;
  onIndustryCodesChange: (values: string[]) => void;
  onIndustryDetailCodesChange: (values: string[]) => void;
  onTurnoverSizeCodesChange: (values: string[]) => void;
  actions?: ReactNode;
  embedded?: boolean;
};

const EMPLOYEE_BUCKETS: RangeBucket[] = [
  { value: "1", label: "0 anst.", min: 0, max: 0 },
  { value: "2", label: "1-4 anst.", min: 1, max: 4 },
  { value: "3", label: "5-9 anst.", min: 5, max: 9 },
  { value: "4", label: "10-19 anst.", min: 10, max: 19 },
  { value: "5", label: "20-49 anst.", min: 20, max: 49 },
  { value: "6", label: "50-99 anst.", min: 50, max: 99 },
  { value: "7", label: "100-199 anst.", min: 100, max: 199 },
  { value: "8", label: "200-499 anst.", min: 200, max: 499 },
  { value: "9", label: "500-999 anst.", min: 500, max: 999 },
  { value: "10", label: "1000-1499 anst.", min: 1000, max: 1499 },
  { value: "11", label: "1500-1999 anst.", min: 1500, max: 1999 },
  { value: "12", label: "2000-2999 anst.", min: 2000, max: 2999 },
  { value: "13", label: "3000-3999 anst.", min: 3000, max: 3999 },
  { value: "14", label: "4000-4999 anst.", min: 4000, max: 4999 },
  { value: "15", label: "5000-9999 anst.", min: 5000, max: 9999 },
  { value: "16", label: "10000+ anst.", min: 10000, max: 10000 },
];

const TURNOVER_BUCKETS: RangeBucket[] = [
  { value: "0", label: "< 1 tkr", min: 0, max: 0 },
  { value: "1", label: "1-499 tkr", min: 1, max: 499 },
  { value: "2", label: "500-999 tkr", min: 500, max: 999 },
  { value: "3", label: "1 000-4 999 tkr", min: 1000, max: 4999 },
  { value: "4", label: "5 000-9 999 tkr", min: 5000, max: 9999 },
  { value: "5", label: "10 000-19 999 tkr", min: 10000, max: 19999 },
  { value: "6", label: "20 000-49 999 tkr", min: 20000, max: 49999 },
  { value: "7", label: "50 000-99 999 tkr", min: 50000, max: 99999 },
  { value: "8", label: "100 000-499 999 tkr", min: 100000, max: 499999 },
  { value: "9", label: "500 000-999 999 tkr", min: 500000, max: 999999 },
  { value: "10", label: "1 000 000-4 999 999 tkr", min: 1000000, max: 4999999 },
  { value: "11", label: "5 000 000-9 999 999 tkr", min: 5000000, max: 9999999 },
  { value: "12", label: "10 000 000+ tkr", min: 10000000, max: 10000000 },
];

const EMPLOYEE_RANGE: RangeValue = [0, EMPLOYEE_BUCKETS.length - 1];
const TURNOVER_RANGE: RangeValue = [0, TURNOVER_BUCKETS.length - 1];

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function bucketValuesInRange(
  buckets: RangeBucket[],
  [startIndex, endIndex]: RangeValue,
) {
  return buckets
    .slice(startIndex, endIndex + 1)
    .map((bucket) => bucket.value);
}

function rangeFromSelectedBuckets(
  buckets: RangeBucket[],
  selectedValues: string[],
  fallback: RangeValue,
): RangeValue {
  const selectedIndexes = buckets
    .map((bucket, index) => (selectedValues.includes(bucket.value) ? index : -1))
    .filter((index) => index >= 0);

  if (selectedIndexes.length === 0) return fallback;

  return [Math.min(...selectedIndexes), Math.max(...selectedIndexes)];
}

function isFullRange(range: RangeValue, fullRange: RangeValue) {
  return range[0] <= fullRange[0] && range[1] >= fullRange[1];
}

function RangeFilterControl({
  value,
  buckets,
  onChange,
  onCommit,
}: {
  value: RangeValue;
  buckets: RangeBucket[];
  onChange: (value: RangeValue) => void;
  onCommit: (value: RangeValue) => void;
}) {
  const min = 0;
  const max = buckets.length - 1;
  const selectedStart = buckets[value[0]];
  const selectedEnd = buckets[value[1]];
  const selectedLabel =
    value[0] === value[1]
      ? selectedStart.label
      : `${selectedStart.label} - ${selectedEnd.label}`;
  const startPercent = (value[0] / max) * 100;
  const endOffsetPercent = ((max - value[1]) / max) * 100;
  const selectionStyle = {
    left: `calc(8px + ${startPercent}% - ${startPercent * 0.16}px)`,
    right: `calc(8px + ${endOffsetPercent}% - ${endOffsetPercent * 0.16}px)`,
  };

  function updateMin(nextMin: number) {
    onChange([Math.min(nextMin, value[1]), value[1]]);
  }

  function updateMax(nextMax: number) {
    onChange([value[0], Math.max(nextMax, value[0])]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{selectedLabel}</span>
      </div>

      <div className="range-filter relative h-7">
        <div className="range-filter-track" />
        <div className="range-filter-selection" style={selectionStyle} />
        <div className="range-filter-ticks" aria-hidden="true">
          {buckets.map((bucket) => (
            <span key={bucket.value} className="range-filter-tick" />
          ))}
        </div>
        <input
          aria-label="Min"
          type="range"
          min={min}
          max={max}
          step={1}
          value={value[0]}
          onChange={(event) => updateMin(Number(event.target.value))}
          onPointerUp={(event) =>
            onCommit([Number(event.currentTarget.value), value[1]])
          }
          onKeyUp={(event) =>
            onCommit([Number(event.currentTarget.value), value[1]])
          }
        />
        <input
          aria-label="Max"
          type="range"
          min={min}
          max={max}
          step={1}
          value={value[1]}
          onChange={(event) => updateMax(Number(event.target.value))}
          onPointerUp={(event) =>
            onCommit([value[0], Number(event.currentTarget.value)])
          }
          onKeyUp={(event) =>
            onCommit([value[0], Number(event.currentTarget.value)])
          }
        />
      </div>
    </div>
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
  sizeClassCodes,
  sectionCodes,
  industryCodes,
  industryDetailCodes,
  turnoverSizeCodes,
  onCountyCodesChange,
  onMunicipalityCodesChange,
  onSizeClassCodesChange,
  onSectionCodesChange,
  onIndustryCodesChange,
  onIndustryDetailCodesChange,
  onTurnoverSizeCodesChange,
  actions,
  embedded = false,
}: CompanyFilterPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDetailSearch, setIndustryDetailSearch] = useState("");
  const [employeeRange, setEmployeeRange] = useState<RangeValue>(
    rangeFromSelectedBuckets(EMPLOYEE_BUCKETS, sizeClassCodes, EMPLOYEE_RANGE),
  );
  const [turnoverRange, setTurnoverRange] = useState<RangeValue>(
    rangeFromSelectedBuckets(TURNOVER_BUCKETS, turnoverSizeCodes, TURNOVER_RANGE),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEmployeeRange(
        rangeFromSelectedBuckets(
          EMPLOYEE_BUCKETS,
          sizeClassCodes,
          EMPLOYEE_RANGE,
        ),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [sizeClassCodes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTurnoverRange(
        rangeFromSelectedBuckets(
          TURNOVER_BUCKETS,
          turnoverSizeCodes,
          TURNOVER_RANGE,
        ),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [turnoverSizeCodes]);

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

  const totalSelectedCount =
    countyCodes.length +
    municipalityCodes.length +
    sizeClassCodes.length +
    sectionCodes.length +
    industryCodes.length +
    industryDetailCodes.length +
    turnoverSizeCodes.length;

  function commitEmployeeRange(range: RangeValue) {
    onSizeClassCodesChange(
      isFullRange(range, EMPLOYEE_RANGE)
        ? []
        : bucketValuesInRange(EMPLOYEE_BUCKETS, range),
    );
  }

  function commitTurnoverRange(range: RangeValue) {
    onTurnoverSizeCodesChange(
      isFullRange(range, TURNOVER_RANGE)
        ? []
        : bucketValuesInRange(TURNOVER_BUCKETS, range),
    );
  }

  return (
    <div className={embedded ? "" : ui.cardMuted}>
      <div
        className={[
          "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
          embedded ? "" : "px-4 py-4 md:px-6",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        >
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-100">Filter</h2>

              {totalSelectedCount > 0 && (
                <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs text-slate-700">
                  {totalSelectedCount} valda
                </span>
              )}
            </div>

            <p className={`mt-1 ${ui.helpText}`}>
              Välj geografi, storlek, omsättning och branschhierarki.
            </p>
          </div>

          <span
            className={[
              "shrink-0 text-sm text-slate-500 transition-transform",
              panelOpen ? "rotate-180" : "",
            ].join(" ")}
          >
            v
          </span>
        </button>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {panelOpen && (
        <div
          className={[
            "border-t border-slate-800",
            embedded ? "mt-4 pt-4" : "px-4 py-4 md:px-6 md:py-6",
          ].join(" ")}
        >
          <div className="space-y-4">
            <FilterChipGroup
              title="Län"
              options={COUNTY_OPTIONS}
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
              defaultOpen
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
              title="Företagsstorlek"
              options={SIZE_OPTIONS}
              selectedValues={sizeClassCodes}
              onToggle={(value) =>
                onSizeClassCodesChange(toggleValue(sizeClassCodes, value))
              }
              headerControl={
                <RangeFilterControl
                  value={employeeRange}
                  buckets={EMPLOYEE_BUCKETS}
                  onChange={setEmployeeRange}
                  onCommit={commitEmployeeRange}
                />
              }
            />

            <FilterChipGroup
              title="Omsättning"
              options={TURNOVER_OPTIONS}
              selectedValues={turnoverSizeCodes}
              onToggle={(value) =>
                onTurnoverSizeCodesChange(
                  toggleValue(turnoverSizeCodes, value),
                )
              }
              headerControl={
                <RangeFilterControl
                  value={turnoverRange}
                  buckets={TURNOVER_BUCKETS}
                  onChange={setTurnoverRange}
                  onCommit={commitTurnoverRange}
                />
              }
            />

            <FilterChipGroup
              title="Avdelning"
              options={SECTION_OPTIONS}
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
      )}
    </div>
  );
}
