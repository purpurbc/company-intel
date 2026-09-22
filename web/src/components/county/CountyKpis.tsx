import { KpiCard, KpiGrid } from "@/src/components/ui/KpiCard";

type CountyKpisProps = {
  totals: {
    companies: number;
    active: number;
    employers: number;
    municipalities: number;
    aregions: number;
  };
};

export function CountyKpis({ totals }: CountyKpisProps) {
  const activeShare =
    totals.companies > 0
      ? Math.round((totals.active / totals.companies) * 100)
      : 0;

  const employerShare =
    totals.companies > 0
      ? Math.round((totals.employers / totals.companies) * 100)
      : 0;

  return (
    <KpiGrid>
      <KpiCard
        label="Företag"
        value={totals.companies.toLocaleString("sv-SE")}
      />
      <KpiCard
        label="Verksamma"
        value={totals.active.toLocaleString("sv-SE")}
        detail={`${activeShare}% av totalt`}
      />
      <KpiCard
        label="Arbetsgivare"
        value={totals.employers.toLocaleString("sv-SE")}
        detail={`${employerShare}% av totalt`}
      />
      <KpiCard label="Kommuner" value={totals.municipalities} />
      <KpiCard label="A-regioner" value={totals.aregions} />
    </KpiGrid>
  );
}
