type SwedenKpisProps = {
  totals: {
    companies: number;
    active: number;
    inactive: number;
    never_active: number;
    employers: number;
    vat_registered: number;
    f_tax_registered: number;
    accepts_marketing: number;
    counties: number;
    municipalities: number;
    industry_groups: number;
  };
};

function formatNumber(value: number) {
  return value.toLocaleString("sv-SE");
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

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

export function SwedenKpis({ totals }: SwedenKpisProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
      <KpiCard label="Företag" value={formatNumber(totals.companies)} />
      <KpiCard
        label="Verksamma"
        value={formatNumber(totals.active)}
        sub={`${percent(totals.active, totals.companies)}% av basen`}
      />
      <KpiCard
        label="Arbetsgivare"
        value={formatNumber(totals.employers)}
        sub={`${percent(totals.employers, totals.companies)}% av basen`}
      />
      <KpiCard
        label="Moms + F-skatt"
        value={formatNumber(Math.min(totals.vat_registered, totals.f_tax_registered))}
        sub="Indikation på säljbar bas"
      />
      <KpiCard label="Kommuner" value={formatNumber(totals.municipalities)} />
      <KpiCard
        label="Branschgrupper"
        value={formatNumber(totals.industry_groups)}
      />
    </div>
  );
}
