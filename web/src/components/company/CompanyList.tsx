import type { CompaniesResponse } from "@/src/lib/types";
import { CompanyListItem } from "@/src/components/company/CompanyListItem";
import { List } from "@/src/components/ui/List";

type CompanyListProps = {
  items: CompaniesResponse["items"];
  compact?: boolean;
  startIndex?: number;
  onCompanyOpen?: (
    company: CompaniesResponse["items"][number],
    position: number,
  ) => void;
};

export function CompanyList({
  items,
  compact = false,
  startIndex = 1,
  onCompanyOpen,
}: CompanyListProps) {
  return (
    <List contentClassName="overflow-hidden">
      {items.map((company, index) => (
        <CompanyListItem
          key={company.company_id ?? company.pe_org_nr ?? company.org_nr}
          company={company}
          compact={compact}
          position={startIndex + index}
          onOpen={() => onCompanyOpen?.(company, startIndex + index)}
          mobileActionPlacement="top"
        />
      ))}
    </List>
  );
}
