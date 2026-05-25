import type { ReactNode } from "react";
import type { MunicipalityOverview } from "@/src/lib/types";

type MunicipalityInsightSectionsProps = {
  municipality: MunicipalityOverview;
};

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-50">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function PlaceholderList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-md border border-dashed border-slate-700 bg-slate-950/30 px-3 py-2 text-sm text-slate-400"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function topName(rows: { name: string; count: number }[]) {
  return rows[0] ? rows[0].name : "Saknas";
}

export function MunicipalityInsightSections({
  municipality,
}: MunicipalityInsightSectionsProps) {
  const employerShare =
    municipality.totals.companies > 0
      ? Math.round(
          (municipality.totals.employers / municipality.totals.companies) * 100,
        )
      : 0;

  const activeShare =
    municipality.totals.companies > 0
      ? Math.round(
          (municipality.totals.active / municipality.totals.companies) * 100,
        )
      : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SectionCard title="Municipality Sales Summary" eyebrow="MVP-insikt">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Största bransch"
            value={topName(municipality.by_industry)}
            sub="Baserat på antal företag"
          />
          <Metric
            label="Vanligaste storlek"
            value={topName(municipality.by_size)}
            sub="Anställdklass"
          />
          <Metric label="Aktiva företag" value={`${activeShare}%`} />
          <Metric label="Arbetsgivare" value={`${employerShare}%`} />
        </div>
      </SectionCard>

      <SectionCard title="Lead Strategy" eyebrow="Kommande user match">
        <PlaceholderList
          items={[
            "Vilka lokala segment matchar användarens erbjudande",
            "Prioriterade branscher för prospektering i kommunen",
            "Rekommenderad outreach-vinkel baserat på lokal företagsmix",
          ]}
        />
      </SectionCard>

      <SectionCard title="Market Signals">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Branschbredd"
            value={municipality.totals.industries}
            sub="Unika SNI-koder i underlaget"
          />
          <Metric
            label="A-region"
            value={topName(municipality.by_aregion)}
            sub="Regional tillhörighet"
          />
          <Metric
            label="Bolagsbas"
            value={municipality.totals.companies.toLocaleString("sv-SE")}
          />
          <Metric
            label="Kvalificerad bas"
            value={municipality.totals.employers.toLocaleString("sv-SE")}
            sub="Företag med arbetsgivarstatus"
          />
        </div>
      </SectionCard>

      <SectionCard title="Recommended Actions">
        <div className="flex flex-wrap gap-2">
          {[
            "Skapa kommunlista",
            "Exportera företag",
            "Jämför med annan kommun",
            "AI-analysera lokal marknad",
            "Bygg outreach",
          ].map((action) => (
            <button
              key={action}
              type="button"
              disabled
              className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-500"
            >
              {action}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
