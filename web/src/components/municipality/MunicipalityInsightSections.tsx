"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CountByName, MunicipalityOverview } from "@/src/lib/types";

type MunicipalityInsightSectionsProps = {
  municipality: MunicipalityOverview;
};

type TabKey = "overview" | "mix" | "geography" | "insights" | "raw";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Översikt" },
  { key: "mix", label: "Företagsmix" },
  { key: "geography", label: "Geografi" },
  { key: "insights", label: "Insikter" },
  { key: "raw", label: "Raw payload" },
];

function formatNumber(value: number) {
  return value.toLocaleString("sv-SE");
}

function share(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function shareValue(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function formatShare(part: number, total: number) {
  const value = shareValue(part, total);
  if (value > 0 && value < 1) return "<1%";
  return `${Math.round(value)}%`;
}

function topName(rows: CountByName[]) {
  return rows[0]?.name ?? "-";
}

function countByCodes(rows: CountByName[] = [], codes: string[]) {
  const codeSet = new Set(codes);
  return rows.reduce(
    (sum, row) => (codeSet.has(row.code) ? sum + row.count : sum),
    0,
  );
}

function SectionBlock({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3",
        className,
      ].join(" ")}
    >
      <h2 className="text-base font-bold text-app-text">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function DataGrid({
  rows,
  valueAlign = "left",
}: {
  rows: { label: string; value: ReactNode | null }[];
  valueAlign?: "left" | "right";
}) {
  return (
    <dl className="divide-y divide-app-border/70">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2 text-xs sm:grid-cols-[10rem_minmax(0,1fr)]"
        >
          <dt className="min-w-0 truncate text-[11px] font-medium uppercase text-app-text-subtle">
            {row.label}
          </dt>
          <dd
            className={[
              "min-w-0 font-medium text-app-text",
              valueAlign === "right" ? "text-right" : "text-left",
            ].join(" ")}
          >
            {row.value ?? "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
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

function BarList({
  title,
  items,
  initialItems = 8,
  className = "",
}: {
  title: string;
  items: CountByName[];
  initialItems?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.count - a.count),
    [items],
  );
  const visibleItems = expanded ? sortedItems : sortedItems.slice(0, initialItems);
  const total = sortedItems.reduce((sum, item) => sum + item.count, 0);
  const hasMore = sortedItems.length > initialItems;

  return (
    <SectionBlock title={title} className={className}>
      {visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const width = Math.max(
              item.count > 0 ? 2 : 0,
              shareValue(item.count, total),
            );

            return (
              <div key={`${item.code}-${item.name}`} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <div className="min-w-0 truncate font-medium text-app-text">
                    {item.name}
                  </div>
                  <div className="shrink-0 tabular-nums text-app-text-muted">
                    {formatNumber(item.count)} · {formatShare(item.count, total)}
                  </div>
                </div>
                <div className="h-1.5 bg-app-panel-muted">
                  <div
                    className="h-full bg-app-accent-text"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-app-border bg-app-panel-muted p-3 text-sm text-app-text-muted">
          Ingen data finns i underlaget.
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 h-8 rounded-sm border border-app-border bg-app-panel-muted px-3 text-xs font-medium text-app-text transition hover:border-app-border-strong hover:bg-app-panel-hover"
        >
          {expanded ? "Visa färre" : `Visa alla ${sortedItems.length}`}
        </button>
      ) : null}
    </SectionBlock>
  );
}

function StatusTile({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-xs">
      <div className="min-w-0 truncate font-medium text-app-text">{label}</div>
      <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
        <span className="font-semibold text-app-text">{formatNumber(value)}</span>
        <span className="text-app-text-muted">{formatShare(value, total)}</span>
      </div>
    </div>
  );
}

function StatusConcentration({ municipality }: MunicipalityInsightSectionsProps) {
  const total = municipality.totals.companies;
  const statusItems = [
    {
      label: "Normalläge",
      value: countByCodes(municipality.by_state, ["0"]),
    },
    {
      label: "Konkurs inledd",
      value: countByCodes(municipality.by_state, ["20"]),
    },
    {
      label: "Likvidation beslutad/pågår",
      value: countByCodes(municipality.by_state, ["32", "33"]),
    },
    {
      label: "Företagsrekonstruktion",
      value: countByCodes(municipality.by_state, ["80"]),
    },
    {
      label: "Ej längre verksam",
      value: countByCodes(municipality.by_status, ["9"]),
    },
    {
      label: "Aldrig verksam",
      value: countByCodes(municipality.by_status, ["0"]),
    },
    {
      label: "Avförd/avregistrerad",
      value: countByCodes(municipality.by_state, [
        "50",
        "51",
        "52",
        "53",
        "54",
        "60",
        "61",
        "62",
        "63",
        "64",
        "70",
        "71",
        "73",
        "74",
        "77",
      ]),
    },
    {
      label: "Fusion/delning pågår",
      value: countByCodes(municipality.by_state, ["40", "45", "49", "90", "99"]),
    },
    {
      label: "Avslutad insolvens",
      value: countByCodes(municipality.by_state, ["21", "22", "24", "81", "82"]),
    },
  ];

  return (
    <SectionBlock title="Statuslägen">
      <div className="divide-y divide-app-border/70">
        {statusItems.map((item) => (
          <StatusTile
            key={item.label}
            label={item.label}
            value={item.value}
            total={total}
          />
        ))}
      </div>
    </SectionBlock>
  );
}

function OverviewTab({ municipality }: MunicipalityInsightSectionsProps) {
  const countyHref = municipality.county_code
    ? `/county/${encodeURIComponent(municipality.county_code)}`
    : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <SectionBlock title="Företagsbas">
          <DataGrid
            valueAlign="right"
            rows={[
              {
                label: "Företag",
                value: formatNumber(municipality.totals.companies),
              },
              {
                label: "Aktiva",
                value: `${formatNumber(municipality.totals.active)} · ${share(
                  municipality.totals.active,
                  municipality.totals.companies,
                )}`,
              },
              {
                label: "Arbetsgivare",
                value: `${formatNumber(municipality.totals.employers)} · ${share(
                  municipality.totals.employers,
                  municipality.totals.companies,
                )}`,
              },
              {
                label: "Branschbredd",
                value: formatNumber(municipality.totals.industries),
              },
              { label: "Största bransch", value: topName(municipality.by_industry) },
            ]}
          />
        </SectionBlock>

        <SectionBlock title="Geografisk tillhörighet">
          <DataGrid
            valueAlign="right"
            rows={[
              {
                label: "Län",
                value: (
                  <LinkedValue href={countyHref}>
                    {municipality.county_name}
                  </LinkedValue>
                ),
              },
              {
                label: "A-regioner",
                value: formatNumber(municipality.totals.aregions),
              },
              { label: "A-region", value: topName(municipality.by_aregion) },
            ]}
          />
        </SectionBlock>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <StatusConcentration municipality={municipality} />
      </div>
    </div>
  );
}

function MixTab({ municipality }: MunicipalityInsightSectionsProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <BarList title="Storleksklasser" items={municipality.by_size} />
      <BarList
        title="Omsättningsklasser"
        items={municipality.by_turnover}
        initialItems={10}
      />
      <BarList
        title="Branschfördelning"
        items={municipality.by_industry}
        className="xl:col-span-2"
      />
    </div>
  );
}

function GeographyTab({ municipality }: MunicipalityInsightSectionsProps) {
  const countyHref = municipality.county_code
    ? `/county/${encodeURIComponent(municipality.county_code)}`
    : null;
  const mapHref = `/map?municipality=${encodeURIComponent(
    municipality.municipality_code,
  )}`;

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <SectionBlock title="Regional position">
        <DataGrid
          rows={[
            {
              label: "Kommun",
              value: municipality.municipality_name,
            },
            {
              label: "Län",
              value: (
                <LinkedValue href={countyHref}>
                  {municipality.county_name}
                </LinkedValue>
              ),
            },
            { label: "A-region", value: topName(municipality.by_aregion) },
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

      <BarList title="A-regionfördelning" items={municipality.by_aregion} />
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
      title: "Lokala prioritetssegment",
      description:
        "Identifierar vilka branscher och storleksklasser i kommunen som matchar användarens profil, erbjudanden och kundbas bäst.",
    },
    {
      title: "Prospektvinkel per bransch",
      description:
        "Tar fram korta säljingångar utifrån kommunens faktiska företagsmix och vad som sannolikt är relevant lokalt.",
    },
    {
      title: "Kundlikhet i närområdet",
      description:
        "Jämför kommunens bolag med befintliga kunder och markerar var det finns flest lookalike-prospects.",
    },
    {
      title: "Lokal marknadstäthet",
      description:
        "Bedömer om kommunen lämpar sig för fokuserad bearbetning, nischad segmentlista eller som del av ett större regionalt territorium.",
    },
    {
      title: "Nästa bästa handling",
      description:
        "Föreslår om säljaren bör skapa kommunlista, hitta liknande bolag, jämföra mot länet eller bygga outreach-underlag.",
    },
  ];

  return (
    <div className="max-w-3xl">
      <SectionBlock title="Kommuninsikter">
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

function RawTab({ municipality }: MunicipalityInsightSectionsProps) {
  return (
    <SectionBlock title="Raw payload">
      <pre className="max-h-[32rem] overflow-auto rounded-sm bg-app-panel-muted p-3 text-xs leading-5 text-app-text-muted">
        {JSON.stringify(municipality, null, 2)}
      </pre>
    </SectionBlock>
  );
}

export function MunicipalityInsightSections({
  municipality,
}: MunicipalityInsightSectionsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-3">
      <nav
        className="flex gap-1 overflow-x-auto border-b border-app-border"
        aria-label="Kommunvy"
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
        <OverviewTab municipality={municipality} />
      ) : null}
      {activeTab === "mix" ? <MixTab municipality={municipality} /> : null}
      {activeTab === "geography" ? (
        <GeographyTab municipality={municipality} />
      ) : null}
      {activeTab === "insights" ? <InsightsTab /> : null}
      {activeTab === "raw" ? <RawTab municipality={municipality} /> : null}
    </div>
  );
}
