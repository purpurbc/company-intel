import type { CompaniesResponse } from "@/src/lib/types";
import { CompanyListItem } from "@/src/components/company/CompanyListItem";

type CompanyListProps = {
  items: CompaniesResponse["items"];
};

export function CompanyList({ items }: CompanyListProps) {
  return (
    <ul className="divide-y border rounded">
      {items.map((company) => (
        <CompanyListItem key={company.org_nr} company={company} />
      ))}
    </ul>
  );
}