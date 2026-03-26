type CountyKpisProps = {
  totals: {
    companies: number;
    active: number;
    employers: number;
    municipalities: number;
    aregions: number;
  };
};

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <KpiCard
        label="Totalt antal företag"
        value={totals.companies.toLocaleString("sv-SE")}
      />

      <KpiCard
        label="Aktiva företag"
        value={totals.active.toLocaleString("sv-SE")}
        sub={`${activeShare}% av totalt`}
      />

      <KpiCard
        label="Arbetsgivare"
        value={totals.employers.toLocaleString("sv-SE")}
        sub={`${employerShare}% av totalt`}
      />

      <KpiCard
        label="Kommuner"
        value={totals.municipalities}
      />

      <KpiCard
        label="A-regioner"
        value={totals.aregions}
      />
    </div>
  );
}