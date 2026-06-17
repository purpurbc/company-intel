import type { CompaniesResponse } from "@/src/lib/types";
import { CompanyListItem } from "@/src/components/company/CompanyListItem";
import { List } from "@/src/components/ui/List";

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
    <List contentClassName="overflow-hidden">
      {items.map((company, index) => (
        <CompanyListItem
          key={company.org_nr}
          company={company}
          compact={compact}
          position={startIndex + index}
        />
      ))}
    </List>
  );
}
