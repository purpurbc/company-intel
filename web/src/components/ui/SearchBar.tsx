"use client";

import type { CompanySearchBy } from "@/src/lib/types";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { COMPANY_SEARCH_BY_OPTIONS } from "@/src/lib/companySearchOptions";
import { ui } from "@/src/lib/uiStyles";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSearch: () => void;

  searchBy: CompanySearchBy;
  onSearchByChange: (value: CompanySearchBy) => void;

  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  childrenClassName?: string;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  onClear,
  onSearch,
  searchBy,
  onSearchByChange,
  loading = false,
  placeholder,
  children,
  childrenClassName = "",
  className = "",
}: SearchBarProps) {
  return (
    <div className={["w-full max-w-3xl", className].join(" ")}>
      <div className="space-y-3">
        <div className={[ui.searchFrame, "flex min-w-0 items-center gap-2"].join(" ")}>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            aria-label="Sök företag"
            placeholder={placeholder}
            className="h-7 min-w-0 flex-1 bg-transparent px-1.5 text-xs text-app-text outline-none placeholder:text-app-placeholder"
          />

          {value.length > 0 ? (
            <button
              type="button"
              aria-label="Rensa söktext"
              title="Rensa söktext"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
            >
              <MaskedIcon src="/icons/utility/cross.svg" className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <div className="h-7 w-28 min-w-0 shrink-0 border-l border-app-border-strong pl-1">
            <SelectMenu
              label=""
              options={COMPANY_SEARCH_BY_OPTIONS}
              value={searchBy}
              onChange={onSearchByChange}
              align="left"
              embedded
            />
          </div>

          <Button
            onClick={onSearch}
            disabled={loading}
            type="button"
            variant="primary"
            size="sm"
            className="h-7 shrink-0 px-2.5 font-semibold"
          >
            Sök
          </Button>
        </div>

        {children ? (
          <div
            className={[
              "pt-1",
              childrenClassName,
            ].join(" ")}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
