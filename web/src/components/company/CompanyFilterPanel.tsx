"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import {
  COUNTY_OPTIONS,
  INDUSTRY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
  SIZE_OPTIONS,
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

type RangeValue = [number, number];
type RangeBucket = { value: string; label: string; min: number; max: number };

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
  companyAgeRange: RangeValue;
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
  onCompanyAgeRangeChange: (values: RangeValue) => void;
  onPostOrtChange: (value: string) => void;
  onPostNrChange: (value: string) => void;
  onOwnerCategoryCodesChange: (values: string[]) => void;
  onSmeSizeCodesChange: (values: string[]) => void;
  onExportImportMarksChange: (values: string[]) => void;
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

const AGE_BUCKETS: RangeBucket[] = Array.from({ length: 101 }, (_, age) => ({
  value: String(age),
  label: age === 100 ? "100+ år" : `${age} år`,
  min: age,
  max: age,
}));

const EMPLOYEE_RANGE: RangeValue = [0, EMPLOYEE_BUCKETS.length - 1];
const TURNOVER_RANGE: RangeValue = [0, TURNOVER_BUCKETS.length - 1];
const AGE_RANGE: RangeValue = [0, 100];

const EMPLOYER_STATUS_OPTIONS = [
  { value: "0", label: "Har aldrig varit registrerad som arbetsgivare" },
  { value: "1", label: "Är registrerad som vanlig arbetsgivare" },
  { value: "2", label: "Är registrerad som privatarbetsgivare" },
  { value: "3", label: "Är registrerad som arbetsgivare via representant" },
  { value: "4", label: "Är registrerad som ambassad eller konsulat" },
  { value: "9", label: "Är avregistrerad som arbetsgivare" },
];

const VAT_STATUS_OPTIONS = [
  { value: "0", label: "Har aldrig varit registrerad för moms" },
  { value: "1", label: "Är registrerad för moms" },
  { value: "3", label: "Är registrerad för moms via representant" },
  { value: "9", label: "Är avregistrerad för moms" },
];

const F_TAX_STATUS_OPTIONS = [
  { value: "0", label: "Har aldrig varit registrerad för F-skatt" },
  { value: "1", label: "Är registrerad för F-skatt" },
  { value: "9", label: "Är avregistrerad för F-skatt" },
];

const MARKETING_STATUS_OPTIONS = [
  { value: "11", label: "Tar emot reklam, ej telefonnummerspärrat" },
  { value: "12", label: "Tar emot reklam, telefonnummerspärr telemarketing" },
  { value: "13", label: "Tar emot reklam, nix-telefon" },
  { value: "21", label: "Har frånsagt sig reklam, ej telefonnummerspärrat" },
  { value: "22", label: "Har frånsagt sig reklam, telefonnummerspärr telemarketing" },
  { value: "23", label: "Har frånsagt sig reklam, nix-telefon" },
];

const OWNER_CATEGORY_OPTIONS = [
  { value: "10", label: "Statligt" },
  { value: "20", label: "Kommunalt" },
  { value: "30", label: "Regioner" },
  { value: "41", label: "Privat svenskt utan koncern" },
  { value: "42", label: "Privat svenskt med koncern" },
  { value: "50", label: "Utländska" },
];

const SME_SIZE_OPTIONS = [
  { value: "0", label: "0 anställda" },
  { value: "1", label: "1-9 anställda" },
  { value: "2", label: "10-49 anställda" },
  { value: "3", label: "50-249 anställda" },
  { value: "4", label: "250-499 anställda" },
  { value: "5", label: "Minst 500 anställda" },
];

const EXPORT_IMPORT_OPTIONS = [
  { value: "J", label: "Har export/import-markering" },
];

function textFilterInputClass() {
  return `${ui.input} min-w-0`;
}

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
  manualInputs = false,
}: {
  value: RangeValue;
  buckets: RangeBucket[];
  onChange: (value: RangeValue) => void;
  onCommit: (value: RangeValue) => void;
  manualInputs?: boolean;
}) {
  const min = 0;
  const max = buckets.length - 1;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<RangeValue>(value);
  const dragRef = useRef<{
    pointerId: number;
    handle: "min" | "max" | "pending";
    startValue: number;
  } | null>(null);
  const selectedStart = buckets[value[0]];
  const selectedEnd = buckets[value[1]];
  const selectedLabel =
    value[0] === value[1]
      ? selectedStart.label
      : `${selectedStart.label} - ${selectedEnd.label}`;
  const startPercent = (value[0] / max) * 100;
  const endOffsetPercent = ((max - value[1]) / max) * 100;
  const selectionStyle = {
    left: `${startPercent}%`,
    right: `${endOffsetPercent}%`,
  };

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function clampIndex(index: number) {
    return Math.max(min, Math.min(max, index));
  }

  function valueFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return valueRef.current[0];

    const ratio = (clientX - rect.left) / rect.width;
    return clampIndex(Math.round(ratio * max));
  }

  function setRange(next: RangeValue) {
    valueRef.current = next;
    onChange(next);
  }

  function updateRange(nextIndex: number) {
    const current = valueRef.current;
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.handle === "pending") {
      if (nextIndex < drag.startValue) {
        drag.handle = "min";
      } else if (nextIndex > drag.startValue) {
        drag.handle = "max";
      } else {
        return;
      }
    }

    if (drag.handle === "min") {
      setRange([Math.min(nextIndex, current[1]), current[1]]);
    } else {
      setRange([current[0], Math.max(nextIndex, current[0])]);
    }
  }

  function beginDrag(
    event: ReactPointerEvent,
    handle: "min" | "max" | "auto",
  ) {
    event.preventDefault();
    event.stopPropagation();
    const current = valueRef.current;
    const nextIndex = valueFromPointer(event.clientX);
    let nextHandle: "min" | "max" | "pending";

    if (handle === "auto") {
      if (current[0] === current[1]) {
        nextHandle =
          nextIndex < current[0]
            ? "min"
            : nextIndex > current[1]
              ? "max"
              : "pending";
      } else {
        nextHandle =
          Math.abs(nextIndex - current[0]) <= Math.abs(nextIndex - current[1])
            ? "min"
            : "max";
      }
    } else {
      nextHandle = current[0] === current[1] ? "pending" : handle;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      handle: nextHandle,
      startValue: current[0] === current[1] ? current[0] : nextIndex,
    };

    trackRef.current?.setPointerCapture(event.pointerId);
    updateRange(nextIndex);
  }

  function continueDrag(event: ReactPointerEvent) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    updateRange(valueFromPointer(event.clientX));
  }

  function endDrag(event: ReactPointerEvent) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    onCommit(valueRef.current);
  }

  function updateManualMin(nextValue: number) {
    const nextMin = clampIndex(nextValue);
    setRange([Math.min(nextMin, valueRef.current[1]), valueRef.current[1]]);
  }

  function updateManualMax(nextValue: number) {
    const nextMax = clampIndex(nextValue);
    setRange([valueRef.current[0], Math.max(nextMax, valueRef.current[0])]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{selectedLabel}</span>
      </div>

      <div
        ref={trackRef}
        className="relative h-7 touch-none"
        onPointerDown={(event) => beginDrag(event, "auto")}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="absolute left-0 right-0 top-3 h-1 rounded-full bg-slate-800" />
        <div
          className="absolute top-3 h-1 rounded-full bg-emerald-400"
          style={selectionStyle}
        />
        <div
          className="absolute left-0 right-0 top-2 z-10 flex justify-between"
          aria-hidden="true"
        >
          {buckets.map((bucket) => (
            <span key={bucket.value} className="range-filter-tick" />
          ))}
        </div>

        <button
          type="button"
          aria-label="Min"
          className="absolute top-1 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-950 shadow"
          style={{ left: `${startPercent}%` }}
          onPointerDown={(event) => beginDrag(event, "min")}
        />
        <button
          type="button"
          aria-label="Max"
          className="absolute top-1 z-30 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-950 shadow"
          style={{ left: `${100 - endOffsetPercent}%` }}
          onPointerDown={(event) => beginDrag(event, "max")}
        />
      </div>

      {manualInputs ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Min
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={value[0]}
              onChange={(event) => updateManualMin(Number(event.target.value))}
              onBlur={() => onCommit(valueRef.current)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onCommit(valueRef.current);
              }}
              className={ui.input}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Max
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={value[1]}
              onChange={(event) => updateManualMax(Number(event.target.value))}
              onBlur={() => onCommit(valueRef.current)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onCommit(valueRef.current);
              }}
              className={ui.input}
            />
          </label>
        </div>
      ) : null}
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
  const [ageRange, setAgeRange] = useState<RangeValue>(companyAgeRange);
  const [postOrtDraft, setPostOrtDraft] = useState(postOrt);
  const [postNrDraft, setPostNrDraft] = useState(postNr);

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

  useEffect(() => {
    setAgeRange(companyAgeRange);
  }, [companyAgeRange]);

  useEffect(() => {
    setPostOrtDraft(postOrt);
  }, [postOrt]);

  useEffect(() => {
    setPostNrDraft(postNr);
  }, [postNr]);

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
    companyStatusCodes.length +
    companyStateCodes.length +
    employerStatusCodes.length +
    vatStatusCodes.length +
    fTaxStatusCodes.length +
    marketingStatusCodes.length +
    sizeClassCodes.length +
    (companyAgeRange[0] > AGE_RANGE[0] || companyAgeRange[1] < AGE_RANGE[1]
      ? 1
      : 0) +
    (postOrt.trim() ? 1 : 0) +
    (postNr.trim() ? 1 : 0) +
    ownerCategoryCodes.length +
    smeSizeCodes.length +
    exportImportMarks.length +
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

  function commitAgeRange(range: RangeValue) {
    onCompanyAgeRangeChange(range);
  }

  function commitPostalFilters() {
    if (postOrtDraft !== postOrt) onPostOrtChange(postOrtDraft);
    if (postNrDraft !== postNr) onPostNrChange(postNrDraft);
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
              title="Företagsstatus"
              options={COMPANY_STATUS_OPTIONS}
              selectedValues={companyStatusCodes}
              onToggle={(value) =>
                onCompanyStatusCodesChange(
                  toggleValue(companyStatusCodes, value),
                )
              }
              showOptionValues
              defaultOpen
            />

            <FilterChipGroup
              title="Bolagsstatus"
              options={COMPANY_STATE_OPTIONS}
              selectedValues={companyStateCodes}
              onToggle={(value) =>
                onCompanyStateCodesChange(toggleValue(companyStateCodes, value))
              }
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
              title="Företagsålder"
              options={[]}
              selectedValues={
                companyAgeRange[0] > AGE_RANGE[0] ||
                companyAgeRange[1] < AGE_RANGE[1]
                  ? [`${companyAgeRange[0]}-${companyAgeRange[1]}`]
                  : []
              }
              onToggle={() => undefined}
              emptyText="Använd reglaget för att välja åldersspann."
              headerControl={
                <RangeFilterControl
                  value={ageRange}
                  buckets={AGE_BUCKETS}
                  onChange={setAgeRange}
                  onCommit={commitAgeRange}
                  manualInputs
                />
              }
            />

            <div className={ui.card}>
              <div className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Postort
                  </span>
                  <input
                    value={postOrtDraft}
                    onChange={(event) => setPostOrtDraft(event.target.value)}
                    onBlur={commitPostalFilters}
                    placeholder="Ex. Stockholm"
                    className={textFilterInputClass()}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Postnummer
                  </span>
                  <input
                    value={postNrDraft}
                    onChange={(event) => setPostNrDraft(event.target.value)}
                    onBlur={commitPostalFilters}
                    placeholder="Ex. 111 eller 11122"
                    className={textFilterInputClass()}
                  />
                </label>

                <button
                  type="button"
                  onClick={commitPostalFilters}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Applicera
                </button>
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
              title="SME-klass"
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
