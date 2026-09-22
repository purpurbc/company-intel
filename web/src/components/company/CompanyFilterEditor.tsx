"use client";

import type { Dispatch, SetStateAction } from "react";

import { CompanyFilterPanel } from "@/src/components/company/CompanyFilterPanel";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { Inset } from "@/src/components/ui/Surface";
import {
  countCompanyFilterSelections,
  type CompanyFilterState,
} from "@/src/lib/companyFilterState";
import { COMPANY_SEARCH_BY_OPTIONS } from "@/src/lib/companySearchOptions";
import { ui } from "@/src/lib/uiStyles";

export function CompanyFilterEditor({
  value,
  onChange,
}: {
  value: CompanyFilterState;
  onChange: Dispatch<SetStateAction<CompanyFilterState>>;
}) {
  function update<Key extends keyof CompanyFilterState>(
    key: Key,
    nextValue: CompanyFilterState[Key],
  ) {
    onChange((current) => ({ ...current, [key]: nextValue }));
  }

  return (
    <div className="space-y-4">
      <Inset>
        <div className="text-sm font-medium text-app-text">Sökning</div>
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="block min-w-0">
            <span className={ui.label}>Söktext</span>
            <input
              value={value.q}
              onChange={(event) => update("q", event.target.value)}
              className={[ui.input, "mt-2"].join(" ")}
              placeholder="Valfri söktext"
            />
          </label>
          <div className="min-w-0 self-end">
            <SelectMenu
              label="Sök i"
              options={COMPANY_SEARCH_BY_OPTIONS}
              value={value.searchBy}
              onChange={(nextValue) => update("searchBy", nextValue)}
              align="left"
            />
          </div>
        </div>
      </Inset>

      <CompanyFilterPanel
        embedded
        collapsible={false}
        countyCodes={value.countyCodes}
        municipalityCodes={value.municipalityCodes}
        companyStatusCodes={value.companyStatusCodes}
        companyStateCodes={value.companyStateCodes}
        employerStatusCodes={value.employerStatusCodes}
        vatStatusCodes={value.vatStatusCodes}
        fTaxStatusCodes={value.fTaxStatusCodes}
        marketingStatusCodes={value.marketingStatusCodes}
        sizeClassCodes={value.sizeClassCodes}
        companyAgeRange={value.companyAgeRange}
        postOrt={value.postOrt}
        postNr={value.postNr}
        ownerCategoryCodes={value.ownerCategoryCodes}
        smeSizeCodes={value.smeSizeCodes}
        exportImportMarks={value.exportImportMarks}
        sectionCodes={value.sectionCodes}
        industryCodes={value.industryCodes}
        industryDetailCodes={value.industryDetailCodes}
        turnoverSizeCodes={value.turnoverSizeCodes}
        onCountyCodesChange={(nextValue) => update("countyCodes", nextValue)}
        onMunicipalityCodesChange={(nextValue) =>
          update("municipalityCodes", nextValue)
        }
        onCompanyStatusCodesChange={(nextValue) =>
          update("companyStatusCodes", nextValue)
        }
        onCompanyStateCodesChange={(nextValue) =>
          update("companyStateCodes", nextValue)
        }
        onEmployerStatusCodesChange={(nextValue) =>
          update("employerStatusCodes", nextValue)
        }
        onVatStatusCodesChange={(nextValue) =>
          update("vatStatusCodes", nextValue)
        }
        onFTaxStatusCodesChange={(nextValue) =>
          update("fTaxStatusCodes", nextValue)
        }
        onMarketingStatusCodesChange={(nextValue) =>
          update("marketingStatusCodes", nextValue)
        }
        onSizeClassCodesChange={(nextValue) =>
          update("sizeClassCodes", nextValue)
        }
        onCompanyAgeRangeChange={(nextValue) =>
          update("companyAgeRange", nextValue)
        }
        onPostOrtChange={(nextValue) => update("postOrt", nextValue)}
        onPostNrChange={(nextValue) => update("postNr", nextValue)}
        onOwnerCategoryCodesChange={(nextValue) =>
          update("ownerCategoryCodes", nextValue)
        }
        onSmeSizeCodesChange={(nextValue) =>
          update("smeSizeCodes", nextValue)
        }
        onExportImportMarksChange={(nextValue) =>
          update("exportImportMarks", nextValue)
        }
        onSectionCodesChange={(nextValue) =>
          update("sectionCodes", nextValue)
        }
        onIndustryCodesChange={(nextValue) =>
          update("industryCodes", nextValue)
        }
        onIndustryDetailCodesChange={(nextValue) =>
          update("industryDetailCodes", nextValue)
        }
        onTurnoverSizeCodesChange={(nextValue) =>
          update("turnoverSizeCodes", nextValue)
        }
        selectedCount={countCompanyFilterSelections(value)}
      />
    </div>
  );
}
