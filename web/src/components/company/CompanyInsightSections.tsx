import Link from "next/link";
import type { ReactNode } from "react";
import type { Company } from "@/src/lib/types";

type CompanyInsightSectionsProps = {
  company: Company;
};

type SignalTone = "positive" | "neutral" | "warning";

function value(company: Company, key: string): unknown {
  return company[key];
}

function text(company: Company, ...keys: string[]): string | null {
  for (const key of keys) {
    const raw = value(company, key);
    if (typeof raw === "string" && raw.trim()) return raw;
    if (typeof raw === "number") return String(raw);
  }

  return null;
}

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function companyAge(startDate: string | null) {
  if (!startDate) return null;

  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return null;

  const years = new Date().getFullYear() - date.getFullYear();
  if (years <= 0) return "Under 1 år";
  if (years === 1) return "1 år";
  return `${years} år`;
}

function SectionCard({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="mb-4">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number | null;
  sub?: string | null;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-50">
        {value ?? "-"}
      </div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function DataGrid({
  rows,
}: {
  rows: { label: string; value: ReactNode | null }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-md border border-slate-800 bg-slate-950/40 p-3"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {row.label}
          </dt>
          <dd className="mt-1 text-sm text-slate-200">{row.value ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function countyHref(company: Company) {
  const countyCode = text(company, "seat_county_code");
  return countyCode ? `/county/${encodeURIComponent(countyCode)}` : null;
}

function CountyOverviewLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href || !children) return children;

  return (
    <Link
      href={href}
      className="font-medium text-slate-100 underline decoration-slate-600 underline-offset-4 hover:text-white"
    >
      {children}
    </Link>
  );
}

function Signal({
  label,
  detail,
  tone = "neutral",
}: {
  label: string;
  detail?: string | null;
  tone?: SignalTone;
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
        : "border-slate-800 bg-slate-950/50 text-slate-300";

  return (
    <div className={["rounded-md border p-3", toneClass].join(" ")}>
      <div className="text-sm font-medium">{label}</div>
      {detail ? <div className="mt-1 text-xs opacity-75">{detail}</div> : null}
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

function QuickStats({ company }: CompanyInsightSectionsProps) {
  const startDate = text(company, "start_date", "registration_date");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Anställda"
        value={text(company, "size_class", "size_class_name_dim")}
      />
      <StatCard
        label="Omsättning"
        value={text(company, "turnover_fin_size", "turnover_fin_name_dim", "turnover_size")}
      />
      <StatCard label="Arbetsställen" value={text(company, "num_workplaces")} />
      <StatCard
        label="Företagsålder"
        value={companyAge(startDate)}
        sub={formatDate(startDate)}
      />
      <StatCard
        label="Företagsform"
        value={text(company, "legal_form", "legal_form_name_dim")}
      />
    </div>
  );
}

function BusinessSignals({ company }: CompanyInsightSectionsProps) {
  const startDate = text(company, "start_date", "registration_date");
  const age = companyAge(startDate);
  const hasFTax =
    text(company, "f_tax_status_code") === "1" ||
    Boolean(text(company, "f_tax_status"));
  const hasVat =
    text(company, "vat_status_code") === "1" ||
    Boolean(text(company, "vat_status"));
  const isEmployer =
    text(company, "employer_status_code") === "1" ||
    Boolean(text(company, "employer_status"));
  const acceptsMarketing =
    text(company, "reklam_code") === "0" || text(company, "utskick_code") === "0";
  const exportImport = text(company, "export_import_mark");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Signal
        label="Nystartat"
        detail={age ?? "Startdatum saknas"}
        tone={age === "Under 1 år" ? "positive" : "neutral"}
      />
      <Signal
        label="F-skatt"
        detail={text(company, "f_tax_status") ?? "Uppgift saknas"}
        tone={hasFTax ? "positive" : "neutral"}
      />
      <Signal
        label="Momsregistrerat"
        detail={text(company, "vat_status") ?? "Uppgift saknas"}
        tone={hasVat ? "positive" : "neutral"}
      />
      <Signal
        label="Arbetsgivare"
        detail={text(company, "employer_status") ?? "Uppgift saknas"}
        tone={isEmployer ? "positive" : "neutral"}
      />
      <Signal
        label="Tar emot reklam"
        detail={text(company, "reklam", "utskick") ?? "Uppgift saknas"}
        tone={acceptsMarketing ? "positive" : "warning"}
      />
      <Signal
        label="Export/import"
        detail={exportImport ?? "Ingen signal"}
        tone={exportImport ? "positive" : "neutral"}
      />
      <Signal
        label="Status"
        detail={text(company, "company_status", "company_status_name_dim") ?? "Uppgift saknas"}
      />
      <Signal
        label="Risksignaler"
        detail={text(company, "company_state", "company_state_name_dim") ?? "Inga tydliga signaler"}
      />
    </div>
  );
}

function ActionButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-500"
    >
      {children}
    </button>
  );
}

export function CompanyInsightSections({ company }: CompanyInsightSectionsProps) {
  const countyOverviewHref = countyHref(company);

  return (
    <div className="space-y-5">
      <QuickStats company={company} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="AI Business Summary" eyebrow="Kommande insikt">
          <PlaceholderList
            items={[
              "Kort sammanfattning av företaget",
              "Typ av verksamhet och trolig mognad",
              "Trolig situation, behov och köpläge",
            ]}
          />
        </SectionCard>

        <SectionCard title="Lead & Match Scoring" eyebrow="User match">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Potential" value="-" sub="Kräver scoringmodell" />
            <StatCard label="Match" value="-" sub="Kräver användarprofil" />
            <StatCard label="Prioritet" value="-" />
            <StatCard label="Köpsignaler" value="-" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="AI Recommendations" eyebrow="Outreach">
        <PlaceholderList
          items={[
            "Hur företaget bör kontaktas",
            "Vad de sannolikt bryr sig om",
            "Vad man kan sälja till dem",
            "Rekommenderad pitch",
          ]}
        />
      </SectionCard>

      <SectionCard title="Business Signals">
        <BusinessSignals company={company} />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Företagsinformation">
          <DataGrid
            rows={[
              { label: "Juridisk form", value: text(company, "legal_form", "legal_form_name_dim") },
              { label: "Registreringsdatum", value: formatDate(text(company, "registration_date")) },
              { label: "Företagsstatus", value: text(company, "company_status", "company_status_name_dim") },
              { label: "Ägarstruktur", value: text(company, "owner_category", "owner_name") },
              { label: "Privat/offentligt", value: text(company, "private_public") },
              { label: "Sektor", value: text(company, "sector", "sector_name_dim") },
            ]}
          />
        </SectionCard>

        <SectionCard title="Geografi">
          <DataGrid
            rows={[
              {
                label: "Län",
                value: (
                  <CountyOverviewLink href={countyOverviewHref}>
                    {text(company, "seat_county_name", "seat_county")}
                  </CountyOverviewLink>
                ),
              },
              {
                label: "Kommun",
                value: (
                  <CountyOverviewLink href={countyOverviewHref}>
                    {text(company, "seat_municipality_name", "seat_municipality")}
                  </CountyOverviewLink>
                ),
              },
              { label: "A-region", value: text(company, "aregion_name", "aregion") },
              { label: "Adress", value: text(company, "post_address", "co_address") },
              { label: "Postort", value: text(company, "post_ort") },
              { label: "Postnummer", value: text(company, "post_nr") },
            ]}
          />
        </SectionCard>

        <SectionCard title="Verksamhet">
          <DataGrid
            rows={[
              { label: "Bransch / SNI", value: text(company, "bransch_1", "industry_5_name", "bransch_1_name_dim") },
              { label: "SNI-kod", value: text(company, "bransch_1_code") },
              { label: "Avdelning", value: text(company, "avdelning_1", "avdelning_1_name_dim") },
              { label: "Segment", value: text(company, "industry_2_name") },
              { label: "Storleksklass", value: text(company, "size_class", "size_class_name_dim") },
              { label: "Antal firmor", value: text(company, "num_firms") },
            ]}
          />
        </SectionCard>

        <SectionCard title="Ekonomi">
          <DataGrid
            rows={[
              { label: "Omsättningsintervall", value: text(company, "turnover_size", "turnover_gross_name_dim") },
              { label: "Fin omsättning", value: text(company, "turnover_fin_size", "turnover_fin_name_dim") },
              { label: "Omsättningsår", value: text(company, "turnover_year") },
              { label: "SME-klass", value: text(company, "sme_size") },
              { label: "Import", value: text(company, "import_turnover", "export_import_mark") },
              { label: "Export", value: text(company, "export_turnover", "export_import_mark") },
            ]}
          />
        </SectionCard>

        <SectionCard title="Kontakt & Outreach">
          <DataGrid
            rows={[
              { label: "Telefon", value: text(company, "phone") },
              { label: "Email", value: text(company, "email") },
              { label: "Reklamspärr", value: text(company, "reklam", "utskick") },
              { label: "Kontaktrekommendation", value: null },
            ]}
          />
        </SectionCard>

        <SectionCard title="Similar Companies" eyebrow="Kommande analys">
          <PlaceholderList
            items={["Liknande företag", "Konkurrenter", "Närliggande segment"]}
          />
        </SectionCard>

        <SectionCard title="Market Insights" eyebrow="Kommande analys">
          <PlaceholderList
            items={[
              "Antal liknande företag",
              "Regional statistik",
              "Tillväxt i segmentet",
              "Marknadstrender",
            ]}
          />
        </SectionCard>

        <SectionCard title="User Actions">
          <div className="flex flex-wrap gap-2">
            <ActionButton>Lägg i lista</ActionButton>
            <ActionButton>Exportera</ActionButton>
            <ActionButton>Jämför</ActionButton>
            <ActionButton>AI-analysera</ActionButton>
            <ActionButton>Skapa outreach</ActionButton>
            <ActionButton>CRM-sync</ActionButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
