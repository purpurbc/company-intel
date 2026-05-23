"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  COUNTY_OPTIONS,
  INDUSTRY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
  SIZE_OPTIONS,
} from "@/src/lib/companyFilterOptions";
import { ui } from "@/src/lib/uiStyles";
import { FilterChipGroup } from "@/src/components/company/FilterChipGroup";

type CompanyFilterPanelProps = {
  countyCodes: string[];
  municipalityCodes: string[];
  sizeClassCodes: string[];
  industryCodes: string[];
  onCountyCodesChange: (values: string[]) => void;
  onMunicipalityCodesChange: (values: string[]) => void;
  onSizeClassCodesChange: (values: string[]) => void;
  onIndustryCodesChange: (values: string[]) => void;
  actions?: ReactNode;
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function CompanyFilterPanel({
  countyCodes,
  municipalityCodes,
  sizeClassCodes,
  industryCodes,
  onCountyCodesChange,
  onMunicipalityCodesChange,
  onSizeClassCodesChange,
  onIndustryCodesChange,
  actions,
}: CompanyFilterPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");

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
    const q = industrySearch.trim().toLowerCase();
    if (!q) return INDUSTRY_OPTIONS;

    return INDUSTRY_OPTIONS.filter((option) =>
      `${option.value} ${option.label}`.toLowerCase().includes(q),
    );
  }, [industrySearch]);

  const totalSelectedCount =
    countyCodes.length +
    municipalityCodes.length +
    sizeClassCodes.length +
    industryCodes.length;

  return (
    <div className={ui.cardMuted}>
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6">
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
              Välj geografi, storlek och branscher. Detta blir samma struktur
              som ICP senare fyller i.
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
        <div className="border-t border-slate-800 px-4 py-4 md:px-6 md:py-6">
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
            />

            <FilterChipGroup
              title="Bransch"
              options={visibleIndustries}
              selectedValues={industryCodes}
              onToggle={(value) =>
                onIndustryCodesChange(toggleValue(industryCodes, value))
              }
              searchable
              searchValue={industrySearch}
              onSearchChange={setIndustrySearch}
            />
          </div>
        </div>
      )}
    </div>
  );
}
