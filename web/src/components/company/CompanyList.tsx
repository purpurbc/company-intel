import type { CompaniesResponse } from "@/src/lib/types";
import { CompanyListItem } from "@/src/components/company/CompanyListItem";

type CompanyListProps = {
  items: CompaniesResponse["items"];
  compact?: boolean;
  startIndex?: number;
};

export function CompanyList({
  items,
  compact = false,
  startIndex = 1,
}: CompanyListProps) {
  return (
    <ul className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      {items.map((company, index) => (
        <CompanyListItem
          key={company.org_nr}
          company={company}
          compact={compact}
          position={startIndex + index}
        />
      ))}
    </ul>
  );
}
