import type { CompanySearchBy } from "@/src/lib/types";

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

const LIMIT_OPTIONS = [10, 25, 50, 100];

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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder={placeholder}
          className="border rounded px-3 py-2 w-full"
        />

        <select
          value={searchBy}
          onChange={(e) => onSearchByChange(e.target.value as CompanySearchBy)}
          className="border rounded px-3 py-2"
        >
          <option value="all">Sök i alla</option>
          <option value="company_name">Företagsnamn</option>
          <option value="org_nr">Org.nr</option>
          <option value="seat_municipality_name">Kommun</option>

        </select>

        <button
          onClick={onSearch}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          Sök
        </button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="text-sm text-gray-600">Rader per sida</label>

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border rounded px-3 py-2 md:w-36"
        >
          {LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}