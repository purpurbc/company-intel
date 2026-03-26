import Link from "next/link";
import type { CompaniesResponse } from "@/src/lib/types";

type CompanyListItemProps = {
  company: CompaniesResponse["items"][number];
};

export function CompanyListItem({ company }: CompanyListItemProps) {
  return (
    <li className="p-3">
      <Link
        href={`/company/${encodeURIComponent(company.org_nr)}`}
        className="font-medium hover:underline"
      >
        {company.company_name}
      </Link>

      <div className="text-sm text-gray-600">
        {company.org_nr}
        {" · "}
        {company.seat_municipality_name ?? "-"}
        {", "}
        {company.seat_county_name ?? "-"}
        {" · "}
        {company.post_ort ?? "-"}
      </div>

      <div className="text-sm">{company.industry_5_name ?? ""}</div>
    </li>
  );
}