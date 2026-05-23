import type { CompanySearchBy } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";
import { Button } from "@/src/components/ui/Button";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;

  searchBy: CompanySearchBy;
  onSearchByChange: (value: CompanySearchBy) => void;

  limit: number;
  onLimitChange: (value: number) => void;

  loading?: boolean;
  placeholder?: string;
};

const LIMIT_OPTIONS = [10, 25, 50, 100, 200, 500];

export function SearchBar({
  value,
  onChange,
  onSearch,
  searchBy,
  onSearchByChange,
  limit,
  onLimitChange,
  loading = false,
  placeholder,
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

          <select
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className={ui.label}>Rader per sida</label>

          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className={[ui.select, "sm:w-36"].join(" ")}
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
