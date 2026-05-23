import type { ReactNode } from "react";
import type { CountyOverview } from "@/src/lib/types";

type CountyInsightSectionsProps = {
  county: CountyOverview;
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

export function CountyInsightSections({ county }: CountyInsightSectionsProps) {
  const employerShare =
    county.totals.companies > 0
      ? Math.round((county.totals.employers / county.totals.companies) * 100)
      : 0;

  const activeShare =
    county.totals.companies > 0
      ? Math.round((county.totals.active / county.totals.companies) * 100)
      : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SectionCard title="Regional Sales Summary" eyebrow="MVP-insikt">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Största kommun"
            value={topName(county.by_municipality)}
            sub="Baserat på antal företag"
          />
          <Metric
            label="Största A-region"
            value={topName(county.by_aregion)}
            sub="Regional koncentration"
          />
          <Metric label="Aktiva företag" value={`${activeShare}%`} />
          <Metric label="Arbetsgivare" value={`${employerShare}%`} />
        </div>
      </SectionCard>

      <SectionCard title="Lead Strategy" eyebrow="Kommande user match">
        <PlaceholderList
          items={[
            "Vilka segment i länet matchar användarens erbjudande",
            "Prioriterade kommuner för prospektering",
            "Rekommenderad outreach-vinkel per segment",
          ]}
        />
      </SectionCard>

      <SectionCard title="Market Signals">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Marknadsbredd"
            value={county.totals.municipalities}
            sub="Kommuner med registrerade företag"
          />
          <Metric
            label="Regional spridning"
            value={county.totals.aregions}
            sub="A-regioner i underlaget"
          />
          <Metric
            label="Bolagsbas"
            value={county.totals.companies.toLocaleString("sv-SE")}
          />
          <Metric
            label="Kvalificerad bas"
            value={county.totals.employers.toLocaleString("sv-SE")}
            sub="Företag med arbetsgivarstatus"
          />
        </div>
      </SectionCard>

      <SectionCard title="Recommended Actions">
        <div className="flex flex-wrap gap-2">
          {[
            "Skapa länslista",
            "Exportera företag",
            "Jämför med annat län",
            "AI-analysera marknad",
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
