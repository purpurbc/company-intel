"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Company, CompanyTurnoverHistoryItem } from "@/src/lib/types";
import { INDUSTRY_OPTIONS } from "@/src/lib/companyFilterOptions";

type CompanyInsightSectionsProps = {
  company: Company;
  turnoverHistory?: CompanyTurnoverHistoryItem[];
};

type TabKey = "overview" | "insights" | "contact" | "raw";

type TurnoverRange = {
  min: number;
  max: number;
  label: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Översikt" },
  { key: "insights", label: "Insikter" },
  { key: "contact", label: "Kontakt" },
  { key: "raw", label: "Raw payload" },
];

const TURNOVER_GROSS_RANGES: Record<string, TurnoverRange> = {
  "0": { min: 0, max: 1, label: "< 1 tkr" },
  "1": { min: 1, max: 499, label: "1 - 499 tkr" },
  "2": { min: 500, max: 999, label: "500 - 999 tkr" },
  "3": { min: 1000, max: 4999, label: "1 000 - 4 999 tkr" },
  "4": { min: 5000, max: 9999, label: "5 000 - 9 999 tkr" },
  "5": { min: 10000, max: 19999, label: "10 000 - 19 999 tkr" },
  "6": { min: 20000, max: 49999, label: "20 000 - 49 999 tkr" },
  "7": { min: 50000, max: 99999, label: "50 000 - 99 999 tkr" },
  "8": { min: 100000, max: 499999, label: "100 000 - 499 999 tkr" },
  "9": { min: 500000, max: 999999, label: "500 000 - 999 999 tkr" },
  "10": { min: 1000000, max: 4999999, label: "1 000 000 - 4 999 999 tkr" },
  "11": { min: 5000000, max: 9999999, label: "5 000 000 - 9 999 999 tkr" },
  "12": { min: 10000000, max: 10000000, label: "> 9 999 999 tkr" },
};

const TURNOVER_FIN_RANGES: Record<string, TurnoverRange> = {
  "1": { min: 0, max: 1, label: "< 1 tkr" },
  "2": { min: 1, max: 49, label: "1 - 49 tkr" },
  "3": { min: 50, max: 99, label: "50 - 99 tkr" },
  "4": { min: 100, max: 149, label: "100 - 149 tkr" },
  "5": { min: 150, max: 199, label: "150 - 199 tkr" },
  "6": { min: 200, max: 299, label: "200 - 299 tkr" },
  "7": { min: 300, max: 399, label: "300 - 399 tkr" },
  "8": { min: 400, max: 499, label: "400 - 499 tkr" },
  "9": { min: 500, max: 749, label: "500 - 749 tkr" },
  "10": { min: 750, max: 999, label: "750 - 999 tkr" },
  "11": { min: 1000, max: 2499, label: "1 000 - 2 499 tkr" },
  "12": { min: 2500, max: 4999, label: "2 500 - 4 999 tkr" },
  "13": { min: 5000, max: 9999, label: "5 000 - 9 999 tkr" },
  "14": { min: 10000, max: 19999, label: "10 000 - 19 999 tkr" },
  "15": { min: 20000, max: 49999, label: "20 000 - 49 999 tkr" },
  "16": { min: 50000, max: 99999, label: "50 000 - 99 999 tkr" },
  "17": { min: 100000, max: 499999, label: "100 000 - 499 999 tkr" },
  "18": { min: 500000, max: 999999, label: "500 000 - 999 999 tkr" },
  "19": { min: 1000000, max: 4999999, label: "1 000 000 - 4 999 999 tkr" },
  "20": { min: 5000000, max: 9999999, label: "5 000 000 - 9 999 999 tkr" },
  "21": { min: 10000000, max: 10000000, label: "> 9 999 999 tkr" },
};

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

function formatTkr(value: number) {
  return `${value.toLocaleString("sv-SE")} tkr`;
}

function countyHref(company: Company) {
  const countyCode = text(company, "seat_county_code");
  return countyCode ? `/county/${encodeURIComponent(countyCode)}` : null;
}

function municipalityHref(company: Company) {
  const municipalityCode = text(company, "seat_municipality_code");
  return municipalityCode
    ? `/municipality/${encodeURIComponent(municipalityCode)}`
    : null;
}

function municipalityMapHref(company: Company) {
  const municipalityCode = text(company, "seat_municipality_code");
  return municipalityCode
    ? `/map?municipality=${encodeURIComponent(municipalityCode)}`
    : "/map";
}

function industryGroup(company: Company) {
  const code = text(company, "bransch_1_code")?.slice(0, 2);
  if (!code) return null;

  const option = INDUSTRY_OPTIONS.find((item) => item.value === code);
  return option ? `${code} ${option.label}` : code;
}

function LinkedValue({
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
      className="font-medium text-app-text underline decoration-app-border-strong underline-offset-4 hover:text-app-accent-text"
    >
      {children}
    </Link>
  );
}

function SectionBlock({
  title,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={[
        "rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3",
        className,
      ].join(" ")}
    >
      <h2 className="text-sm font-semibold text-app-text">{title}</h2>
      <div className={["mt-2", bodyClassName].join(" ")}>{children}</div>
    </section>
  );
}

function DataGrid({
  rows,
}: {
  rows: { label: string; value: ReactNode | null }[];
}) {
  return (
    <dl className="divide-y divide-app-border/70">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 text-xs sm:grid-cols-[9.5rem_minmax(0,1fr)]"
        >
          <dt className="min-w-0 truncate text-[11px] font-medium uppercase text-app-text-subtle">
            {row.label}
          </dt>
          <dd className="min-w-0 text-left font-medium text-app-text">
            {row.value ?? "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TurnoverHistoryChart({
  items = [],
}: {
  items?: CompanyTurnoverHistoryItem[];
}) {
  const [newestFirst, setNewestFirst] = useState(false);
  const chartItems = items
    .map((item) => {
      const grossRange = item.turnover_size_code
        ? TURNOVER_GROSS_RANGES[item.turnover_size_code]
        : null;
      const finRange = item.turnover_fin_size_code
        ? TURNOVER_FIN_RANGES[item.turnover_fin_size_code]
        : null;

      return {
        ...item,
        grossRange,
        finRange,
      };
    })
    .filter((item) => item.grossRange || item.finRange)
    .sort((a, b) => (newestFirst ? b.year - a.year : a.year - b.year));

  if (chartItems.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-app-border bg-app-panel-muted p-3 text-sm text-app-text-muted">
        Ingen omsättningshistorik finns ännu.
      </div>
    );
  }

  const chartMax = Math.max(
    1,
    ...chartItems.map((item) =>
      Math.max(item.grossRange?.max ?? 0, item.finRange?.max ?? 0),
    ),
  );
  const axisTicks = Array.from(
    new Set(
      chartItems.flatMap((item) => {
        const grossRange = item.grossRange ?? item.finRange;
        const finRange = item.finRange;
        return [
          finRange?.min,
          finRange?.max,
          grossRange?.max,
        ].filter((item): item is number => typeof item === "number");
      }),
    ),
  ).sort((a, b) => a - b);
  const axisLabelGroups = axisTicks.reduce<number[][]>((groups, tickValue) => {
    const previousGroup = groups[groups.length - 1];
    const previousValue = previousGroup?.[previousGroup.length - 1];
    const isClose =
      typeof previousValue === "number" &&
      Math.abs((tickValue - previousValue) / chartMax) * 100 < 7;

    if (previousGroup && isClose) {
      previousGroup.push(tickValue);
    } else {
      groups.push([tickValue]);
    }

    return groups;
  }, []);

  return (
    <div className="border border-app-border bg-app-panel-muted p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase text-app-text-subtle">
          Omsättningshistorik
        </div>
        <button
          type="button"
          onClick={() => setNewestFirst((current) => !current)}
          className="rounded-sm border border-app-border bg-app-panel px-2 py-1 text-xs font-medium text-app-text-muted transition hover:text-app-text"
          aria-pressed={newestFirst}
        >
          {newestFirst ? "Senast vänster" : "Senast höger"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-[4.75rem_minmax(0,1fr)]">
        <div className="relative h-40 border-b border-app-border">
          <div className="absolute inset-x-0 bottom-0 top-4">
            {axisLabelGroups.map((group) => (
              <span
                key={group.join("-")}
                className="absolute right-3 text-right text-[10px] tabular-nums leading-none text-app-text-subtle"
                style={{
                  bottom: `${(group[group.length - 1] / chartMax) * 100}%`,
                }}
              >
                {formatTkr(group[group.length - 1])}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="relative h-40 w-max min-w-full border-b border-app-border">
            <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-center gap-8 px-4">
              {axisTicks.map((tickValue) => (
                <span
                  key={tickValue}
                  className="pointer-events-none absolute left-0 right-0 h-px bg-app-border"
                  style={{ bottom: `${(tickValue / chartMax) * 100}%` }}
                />
              ))}

              {chartItems.map((item) => {
                const grossRange = item.grossRange ?? item.finRange;
                const finRange = item.finRange;
                const grossHeight = Math.max(
                  4,
                  ((grossRange?.max ?? 0) / chartMax) * 100,
                );
                const finBottom = finRange ? (finRange.min / chartMax) * 100 : 0;
                const finHeight = finRange
                  ? Math.max(3, ((finRange.max - finRange.min) / chartMax) * 100)
                  : 0;

                return (
                  <div
                    key={item.year}
                    className="relative z-10 flex h-full w-16 shrink-0 items-end justify-center"
                    title={`${item.year}: ${item.turnover_size ?? grossRange?.label ?? "-"} / ${item.turnover_fin_size ?? finRange?.label ?? "-"}`}
                  >
                    <div className="relative h-full w-9">
                      <div
                        className="absolute bottom-0 left-0 right-0 border border-app-border-strong bg-app-panel"
                        style={{ height: `${grossHeight}%` }}
                      />
                      {finRange ? (
                        <div
                          className="absolute left-1 right-1 bg-app-accent-text"
                          style={{
                            bottom: `${finBottom}%`,
                            height: `${finHeight}%`,
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex w-max min-w-full justify-center gap-8 px-4 pt-2">
            {chartItems.map((item) => (
              <div
                key={item.year}
                className="w-16 shrink-0 text-center text-xs font-medium text-app-text-muted"
              >
                {item.year}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-app-text-subtle">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-4 bg-app-panel ring-1 ring-app-border-strong" />
          Grov omsättningsklass
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-4 bg-app-accent-text" />
          Fin omsättningsklass
        </span>
      </div>
    </div>
  );
}

function OverviewTab({
  company,
  turnoverHistory,
}: CompanyInsightSectionsProps) {
  const startDate = text(company, "start_date", "registration_date");
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);
  const mapHref = municipalityMapHref(company);
  const industryGroupName = industryGroup(company);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <SectionBlock title="Företagsinformation">
          <DataGrid
            rows={[
              { label: "Juridisk form", value: text(company, "legal_form", "legal_form_name_dim") },
              { label: "Registrerat", value: formatDate(text(company, "registration_date")) },
              { label: "Ålder", value: companyAge(startDate) },
              { label: "Status", value: text(company, "company_status", "company_status_name_dim") },
              { label: "Bolagsläge", value: text(company, "company_state", "company_state_name_dim") },
              { label: "Arbetsställen", value: text(company, "num_workplaces") },
              { label: "Privat/offentligt", value: text(company, "private_public") },
              { label: "Sektor", value: text(company, "sector", "sector_name_dim") },
            ]}
          />
        </SectionBlock>

        <SectionBlock title="Verksamhet">
          <DataGrid
            rows={[
              { label: "Bransch", value: text(company, "bransch_1", "industry_5_name", "bransch_1_name_dim") },
              { label: "SNI-kod", value: text(company, "bransch_1_code") },
              { label: "SNI-grupp", value: industryGroupName },
              { label: "Avdelning", value: text(company, "avdelning_1", "avdelning_1_name_dim") },
              { label: "Segment", value: text(company, "industry_2_name") },
              { label: "Anställda", value: text(company, "size_class", "size_class_name_dim") },
            ]}
          />
        </SectionBlock>
      </div>

      <SectionBlock title="Ekonomi">
        <div className="space-y-3">
          <TurnoverHistoryChart items={turnoverHistory} />
          <DataGrid
            rows={[
              { label: "Omsättning", value: text(company, "turnover_size", "turnover_gross_name_dim") },
              { label: "Fin omsättning", value: text(company, "turnover_fin_size", "turnover_fin_name_dim") },
              { label: "Omsättningsår", value: text(company, "turnover_year") },
              { label: "SME-klass", value: text(company, "sme_size") },
              { label: "Import", value: text(company, "import_turnover", "export_import_mark") },
              { label: "Export", value: text(company, "export_turnover", "export_import_mark") },
            ]}
          />
        </div>
      </SectionBlock>

      <SectionBlock title="Geografi">
        <DataGrid
          rows={[
            {
              label: "Kommun",
              value: (
                <LinkedValue href={municipalityOverviewHref}>
                  {text(company, "seat_municipality_name", "seat_municipality")}
                </LinkedValue>
              ),
            },
            {
              label: "Län",
              value: (
                <LinkedValue href={countyOverviewHref}>
                  {text(company, "seat_county_name", "seat_county")}
                </LinkedValue>
              ),
            },
            { label: "A-region", value: text(company, "aregion_name", "aregion") },
            { label: "Adress", value: text(company, "post_address", "co_address") },
            { label: "Postnr", value: text(company, "post_nr") },
            { label: "Postort", value: text(company, "post_ort") },
          ]}
        />
        <div className="mt-3 border-t border-app-border pt-3">
          <Link
            href={mapHref}
            className="inline-flex h-8 items-center rounded-sm border border-app-border bg-app-panel-muted px-3 text-xs font-medium text-app-text transition hover:border-app-border-strong hover:bg-app-panel-hover"
          >
            Visa kommun på karta
          </Link>
        </div>
      </SectionBlock>
    </div>
  );
}

function InsightPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-app-border py-3 last:border-b-0">
      <div className="text-sm font-semibold text-app-text">{title}</div>
      <p className="mt-1 text-sm leading-6 text-app-text-muted">
        {description}
      </p>
    </div>
  );
}

function InsightsTab() {
  const insightItems = [
    {
      title: "Säljvinkel",
      description:
        "AI formulerar varför bolaget är relevant utifrån användarens profil, erbjudanden, befintliga kunder och valda segment.",
    },
    {
      title: "Match mot erbjudanden",
      description:
        "Identifierar vilka erbjudanden som sannolikt passar bolaget och varför de kan vara kommersiellt relevanta.",
    },
    {
      title: "Liknande bästa kunder",
      description:
        "Jämför bolaget med användarens kundbas och lyfter likheter i bransch, storlek, geografi, köpsignaler och behov.",
    },
    {
      title: "Prospect-motiv",
      description:
        "Sammanfattar vad en säljare borde veta innan kontakt: möjlig trigger, tänkbart problem, timing och rekommenderad öppning.",
    },
    {
      title: "Segmentförslag",
      description:
        "Föreslår om bolaget bör ingå i ett befintligt segment eller om det pekar mot ett nytt prospekteringssegment.",
    },
    {
      title: "Nästa bästa handling",
      description:
        "Rekommenderar nästa steg: bevaka, kontakta, lägg i lista, hitta liknande bolag eller skapa outreach-underlag.",
    },
    {
      title: "Prospect-expansion",
      description:
        "Använder bolaget som frö för att hitta fler företag med liknande profil, behov och sannolik säljpotential.",
    },
    {
      title: "Risk och friktion",
      description:
        "Beräknar manuella och AI-baserade varningsflaggor som kan påverka prioritet, pitch eller sannolikhet till affär.",
    },
  ];

  return (
    <div className="max-w-3xl">
      <SectionBlock title="Säljinsikter">
        <div className="divide-y divide-app-border">
          {insightItems.map((item) => (
            <InsightPlaceholder
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

function ContactTab({ company }: CompanyInsightSectionsProps) {
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <SectionBlock title="Kontakt">
        <DataGrid
          rows={[
            { label: "Telefon", value: text(company, "phone", "telephone") },
            { label: "Email", value: text(company, "email") },
            { label: "Webb", value: text(company, "website", "url") },
            { label: "Reklam", value: text(company, "reklam", "utskick") },
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Adress">
        <DataGrid
          rows={[
            { label: "Gata", value: text(company, "post_address", "co_address") },
            { label: "Postnr", value: text(company, "post_nr") },
            { label: "Postort", value: text(company, "post_ort") },
            {
              label: "Kommun",
              value: (
                <LinkedValue href={municipalityOverviewHref}>
                  {text(company, "seat_municipality_name", "seat_municipality")}
                </LinkedValue>
              ),
            },
            {
              label: "Län",
              value: (
                <LinkedValue href={countyOverviewHref}>
                  {text(company, "seat_county_name", "seat_county")}
                </LinkedValue>
              ),
            },
          ]}
        />
      </SectionBlock>
    </div>
  );
}

function RawTab({ company }: CompanyInsightSectionsProps) {
  return (
    <SectionBlock title="Raw payload">
      <pre className="max-h-[32rem] overflow-auto rounded-sm bg-app-panel-muted p-3 text-xs leading-5 text-app-text-muted">
        {JSON.stringify(company, null, 2)}
      </pre>
    </SectionBlock>
  );
}

export function CompanyInsightSections({
  company,
  turnoverHistory = [],
}: CompanyInsightSectionsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-3">
      <nav
        className="flex gap-1 overflow-x-auto border-b border-app-border"
        aria-label="Företagsvy"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "border-b-2 px-3 py-2 text-sm font-medium transition",
                active
                  ? "border-app-accent-border text-app-accent-text"
                  : "border-transparent text-app-text-muted hover:text-app-text",
              ].join(" ")}
              aria-pressed={active}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <OverviewTab company={company} turnoverHistory={turnoverHistory} />
      ) : null}
      {activeTab === "insights" ? <InsightsTab /> : null}
      {activeTab === "contact" ? <ContactTab company={company} /> : null}
      {activeTab === "raw" ? <RawTab company={company} /> : null}
    </div>
  );
}
