import { InfoCard } from "@/src/components/ui/InfoCard";
import { DataRow } from "@/src/components/ui/DataRow";
import { Company } from "@/src/lib/types";

type CompanyOverviewCardProps = {
  company : Company
};

export function CompanyOverviewCard({ company }: CompanyOverviewCardProps) {
  return (
    <InfoCard title="Översikt">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <DataRow label="Bransch" value={company.primary_industry_name} />
        <DataRow label="Avdelning" value={company.industry_section_name} />
        <DataRow label="Omsättning (fin)" value={company.turnover_financial_size} />
        <DataRow label="Anställda" value={company.employee_size} />
        <DataRow label="Verksamhetsform" value={company.organization_form} />
        <DataRow label="Juridisk form" value={company.legal_form} />
        <DataRow label="Sektor" value={company.sector} />
        <DataRow label="Verksamhetsstatus" value={company.activity_status} />
        <DataRow label="Bolagsläge / riskläge" value={company.company_state} />
      </dl>
    </InfoCard>
  );
}
