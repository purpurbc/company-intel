import { InfoCard } from "@/src/components/ui/InfoCard";
import type { Company } from "@/src/lib/types";

type CompanyHeaderCardProps = {
  company: Company;
};

export function CompanyHeaderCard({ company }: CompanyHeaderCardProps) {
  return (
    <InfoCard>
      <h1 className="text-2xl font-semibold">{company.company_name}</h1>
      <div className="text-sm text-gray-600">{company.org_nr}</div>
      <div className="mt-2 text-sm">
        {company.seat_municipality ?? "-"}, {company.seat_county ?? "-"} ·{" "}
        {company.post_ort ?? "-"}
      </div>
    </InfoCard>
  );
}