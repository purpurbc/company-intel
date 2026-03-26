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
        <DataRow label="Bransch" value={company.bransch_1} />
        <DataRow label="Avdelning" value={company.avdelning_1} />
        <DataRow label="Omsättning (fin)" value={company.turnover_fin_size} />
        <DataRow label="Anställda" value={company.size_class} />
        <DataRow label="Juridisk form" value={company.legal_form} />
        <DataRow label="Sektor" value={company.sector} />
        <DataRow label="Status" value={company.company_status} />
        <DataRow label="Bolagsstatus" value={company.company_state} />
      </dl>
    </InfoCard>
  );
}