"use client";

import type { CompanySearchBy } from "@/src/lib/types";
import type { ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";
import { Button } from "@/src/components/ui/Button";
import { SelectMenu } from "@/src/components/ui/SelectMenu";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;

  searchBy: CompanySearchBy;
  onSearchByChange: (value: CompanySearchBy) => void;

  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
};

const SEARCH_BY_OPTIONS: { value: CompanySearchBy; label: string }[] = [
  { value: "all", label: "Sök i alla" },
  { value: "company_name", label: "Företagsnamn" },
  { value: "org_nr", label: "Org.nr" },
];

export function SearchBar({
  value,
  onChange,
  onSearch,
  searchBy,
  onSearchByChange,
  loading = false,
  placeholder,
  children,
}: SearchBarProps) {
  return (
    <div className={[ui.card, "p-4"].join(" ")}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="min-w-0 flex-1">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              placeholder={placeholder}
              className={ui.input}
            />
          </div>

          <div className="lg:w-56">
            <SelectMenu
              label=""
              options={SEARCH_BY_OPTIONS}
              value={searchBy}
              onChange={onSearchByChange}
              align="left"
            />
          </div>

          <select
            hidden
            value={searchBy}
            onChange={(e) => onSearchByChange(e.target.value as CompanySearchBy)}
            className={ui.select}
          >
            <option value="all">Sök i alla</option>
            <option value="company_name">Företagsnamn</option>
            <option value="org_nr">Org.nr</option>
          </select>

          <Button
            onClick={onSearch}
            disabled={loading}
            type="button"
            variant="primary"
          >
            Sök
          </Button>
        </div>

        {children ? (
          <div className="border-t border-slate-800 pt-4">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export const LIMIT_OPTIONS = [10, 25, 50, 100, 200, 500];
