"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { TextLink } from "@/src/components/ui/TextLink";
import { Section } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import type { CountByName, CountyOverview } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

type CountyInsightSectionsProps = {
  county: CountyOverview;
};

type TabKey = "overview" | "mix" | "geography" | "raw";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Översikt" },
  { key: "mix", label: "Företagsmix" },
  { key: "geography", label: "Geografi" },
  { key: "raw", label: "Rådata" },
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
    (sum, row) => (row.code && codeSet.has(row.code) ? sum + row.count : sum),
    0,
  );
}

function SectionBlock({
  title,
  children,
  className = "",
  source,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  source?: string;
}) {
  return (
    <Section title={title} source={source} className={className}>
      {children}
    </Section>
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
    <TextLink href={href}>
      {children}
    </TextLink>
  );
}

function BarList({
  title,
  items,
  hrefPrefix,
  initialItems = 8,
  className = "",
  missingLabel,
}: {
  title: string;
  items: CountByName[];
  hrefPrefix?: string;
  initialItems?: number;
  className?: string;
  missingLabel?: string;
}) {
  return (
    <HorizontalBarList
      title={title}
      items={items}
      hrefPrefix={hrefPrefix}
      previewItems={initialItems}
      maxItems={100}
      className={className}
      missingLabel={missingLabel}
      source="SCB"
    />
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

function StatusConcentration({ county }: CountyInsightSectionsProps) {
  const total = county.totals.companies;
  const activityItems = [
    {
      label: "Verksam",
      value: countByCodes(county.by_activity_status, ["1"]),
    },
    {
      label: "Ej längre verksam",
      value: countByCodes(county.by_activity_status, ["9"]),
    },
    {
      label: "Aldrig verksam",
      value: countByCodes(county.by_activity_status, ["0"]),
    },
  ];
  const companyStateItems = [
    {
      label: "Normalläge",
      value: countByCodes(county.by_company_state, ["0"]),
    },
    {
      label: "Konkurs inledd",
      value: countByCodes(county.by_company_state, ["20"]),
    },
    {
      label: "Likvidation beslutad/pågår",
      value: countByCodes(county.by_company_state, ["32", "33"]),
    },
    {
      label: "Företagsrekonstruktion",
      value: countByCodes(county.by_company_state, ["80"]),
    },
    {
      label: "Avförd/avregistrerad",
      value: countByCodes(county.by_company_state, [
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
      value: countByCodes(county.by_company_state, ["40", "45", "49", "90", "99"]),
    },
    {
      label: "Avslutad insolvens",
      value: countByCodes(county.by_company_state, ["21", "22", "24", "81", "82"]),
    },
  ];

  return (
    <>
    <SectionBlock title="Verksamhetsstatus" source="SCB">
      <div className="divide-y divide-app-border/70">
        {activityItems.map((item) => (
          <StatusTile
            key={item.label}
            label={item.label}
            value={item.value}
            total={total}
          />
        ))}
      </div>
    </SectionBlock>
    <SectionBlock title="Bolagsläge / riskläge" source="Bolagsverket">
      <div className="divide-y divide-app-border/70">
        {companyStateItems.map((item) => (
          <StatusTile key={item.label} label={item.label} value={item.value} total={total} />
        ))}
      </div>
    </SectionBlock>
    </>
  );
}

function OverviewTab({ county }: CountyInsightSectionsProps) {
  const largestMunicipality = county.by_municipality[0];

  return (
    <div className="space-y-3">
      <div className={ui.detailGrid}>
        <SectionBlock title="Företagsbas" source="SCB · Bolagsverket">
          <DataGrid
            valueAlign="right"
            rows={[
              { label: "Företag", value: formatNumber(county.totals.companies) },
              {
                label: "Verksamma",
                value: `${formatNumber(county.totals.active)} · ${share(
                  county.totals.active,
                  county.totals.companies,
                )}`,
              },
              {
                label: "Arbetsgivare",
                value: `${formatNumber(county.totals.employers)} · ${share(
                  county.totals.employers,
                  county.totals.companies,
                )}`,
              },
              { label: "Största bransch", value: topName(county.by_industry) },
            ]}
          />
        </SectionBlock>

        <SectionBlock title="Geografisk täckning" source="SCB">
          <DataGrid
            valueAlign="right"
            rows={[
              {
                label: "Kommuner",
                value: formatNumber(county.totals.municipalities),
              },
              {
                label: "A-regioner",
                value: formatNumber(county.totals.aregions),
              },
              {
                label: "Största kommun",
                value: (
                  <LinkedValue
                    href={
                      largestMunicipality?.code
                        ? `/municipality/${encodeURIComponent(
                            largestMunicipality.code,
                          )}`
                        : null
                    }
                  >
                    {topName(county.by_municipality)}
                  </LinkedValue>
                ),
              },
            ]}
          />
        </SectionBlock>
      </div>

      <div className={ui.detailGrid}>
        <StatusConcentration county={county} />
      </div>
    </div>
  );
}

function MixTab({ county }: CountyInsightSectionsProps) {
  return (
    <div className={ui.detailGrid}>
      <BarList
        title="Storleksklasser"
        items={county.by_size}
        missingLabel="Storleksklass saknas"
      />
      <BarList
        title="Omsättningsklasser"
        items={county.by_turnover}
        initialItems={10}
        missingLabel="Omsättning saknas"
      />
      <BarList
        title="Branschfördelning"
        items={county.by_industry}
        className="xl:col-span-2"
        missingLabel="Branschgrupp saknas"
      />
    </div>
  );
}

function GeographyTab({ county }: CountyInsightSectionsProps) {
  return (
    <div className={ui.detailGrid}>
      <BarList
        title="Kommuner"
        items={county.by_municipality}
        hrefPrefix="/municipality"
        initialItems={10}
        missingLabel="Kommun saknas"
      />
      <BarList
        title="A-regioner"
        items={county.by_aregion}
        missingLabel="A-region saknas"
      />
    </div>
  );
}

function RawTab({ county }: CountyInsightSectionsProps) {
  return (
    <SectionBlock title="Rådata">
      <pre className="max-h-[32rem] overflow-auto rounded-sm bg-app-panel-muted p-3 text-xs leading-5 text-app-text-muted">
        {JSON.stringify(county, null, 2)}
      </pre>
    </SectionBlock>
  );
}

export function CountyInsightSections({ county }: CountyInsightSectionsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-3">
      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Länsvy"
      />

      <AnimatedContent key={activeTab}>
        {activeTab === "overview" ? <OverviewTab county={county} /> : null}
        {activeTab === "mix" ? <MixTab county={county} /> : null}
        {activeTab === "geography" ? <GeographyTab county={county} /> : null}
        {activeTab === "raw" ? <RawTab county={county} /> : null}
      </AnimatedContent>
    </div>
  );
}
