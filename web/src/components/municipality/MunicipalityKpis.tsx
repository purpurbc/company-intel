type MunicipalityKpisProps = {
  totals: {
    companies: number;
    active: number;
    employers: number;
    aregions: number;
    industries: number;
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
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-50">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export function MunicipalityKpis({ totals }: MunicipalityKpisProps) {
  const activeShare =
    totals.companies > 0
      ? Math.round((totals.active / totals.companies) * 100)
      : 0;

  const employerShare =
    totals.companies > 0
      ? Math.round((totals.employers / totals.companies) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <KpiCard
        label="Företag"
        value={totals.companies.toLocaleString("sv-SE")}
      />
      <KpiCard
        label="Aktiva"
        value={totals.active.toLocaleString("sv-SE")}
        sub={`${activeShare}% av totalt`}
      />
      <KpiCard
        label="Arbetsgivare"
        value={totals.employers.toLocaleString("sv-SE")}
        sub={`${employerShare}% av totalt`}
      />
      <KpiCard label="Branscher" value={totals.industries} />
      <KpiCard label="A-regioner" value={totals.aregions} />
    </div>
  );
}
