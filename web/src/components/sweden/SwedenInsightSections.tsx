"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { Section } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import type { CountByName, SwedenOverview } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

type TabKey = "overview" | "geography" | "mix" | "status";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Översikt" },
  { key: "geography", label: "Geografi" },
  { key: "mix", label: "Företagsmix" },
  { key: "status", label: "Status & register" },
];

function formatNumber(value: number) {
  return value.toLocaleString("sv-SE");
}

function share(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function topName(items: CountByName[]) {
  return [...items]
    .filter((item) => item.code && item.code !== "unknown" && item.name && !item.name.toLocaleLowerCase("sv-SE").includes("saknas"))
    .sort((a, b) => b.count - a.count)[0]?.name ?? "-";
}

function DataGrid({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-app-border/70">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 text-sm">
          <dt className="text-app-text-muted">{row.label}</dt>
          <dd className="text-right font-medium tabular-nums text-app-text">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bar({
  title,
  items,
  source,
  hrefPrefix,
  missingLabel,
  previewItems = 8,
}: {
  title: string;
  items: CountByName[];
  source: string;
  hrefPrefix?: string;
  missingLabel: string;
  previewItems?: number;
}) {
  return (
    <HorizontalBarList
      title={title}
      items={items}
      maxItems={100}
      previewItems={previewItems}
      hrefPrefix={hrefPrefix}
      missingLabel={missingLabel}
      source={source}
    />
  );
}

function OverviewTab({ overview }: { overview: SwedenOverview }) {
  const total = overview.totals.companies;
  return (
    <div className={ui.detailGrid}>
      <Section title="Företagsbas" source="SCB · Bolagsverket">
        <DataGrid rows={[
          { label: "Företag", value: formatNumber(total) },
          { label: "Verksamma", value: `${formatNumber(overview.totals.active)} · ${share(overview.totals.active, total)}` },
          { label: "Arbetsgivare", value: `${formatNumber(overview.totals.employers)} · ${share(overview.totals.employers, total)}` },
          { label: "Moms + F-skatt", value: `${formatNumber(overview.totals.vat_and_f_tax)} · ${share(overview.totals.vat_and_f_tax, total)}` },
        ]} />
      </Section>

      <Section title="Marknadsprofil" source="SCB · Bolagsverket">
        <DataGrid rows={[
          { label: "Tar emot reklam", value: `${formatNumber(overview.totals.accepts_marketing)} · ${share(overview.totals.accepts_marketing, total)}` },
          { label: "Största län", value: topName(overview.by_county) },
          { label: "Största bransch", value: topName(overview.by_industry) },
          { label: "Branschgrupper", value: formatNumber(overview.totals.industry_groups) },
        ]} />
      </Section>
    </div>
  );
}

function GeographyTab({ overview }: { overview: SwedenOverview }) {
  return (
    <div className={ui.detailGrid}>
      <Bar title="Företag per län" items={overview.by_county} hrefPrefix="/county" missingLabel="Län saknas" source="SCB" previewItems={10} />
      <Bar title="Största kommuner" items={overview.by_municipality} hrefPrefix="/municipality" missingLabel="Kommun saknas" source="SCB" previewItems={10} />
    </div>
  );
}

function MixTab({ overview }: { overview: SwedenOverview }) {
  return (
    <div className={ui.detailGrid}>
      <Bar title="Branschgrupper" items={overview.by_industry} missingLabel="Branschgrupp saknas" source="SCB" />
      <Bar title="Branschavdelningar" items={overview.by_section} missingLabel="Avdelning saknas" source="SCB" />
      <Bar title="Omsättningsklasser" items={overview.by_turnover} missingLabel="Omsättning saknas" source="SCB" />
      <Bar title="Storleksklasser" items={overview.by_size} missingLabel="Storleksklass saknas" source="SCB" />
    </div>
  );
}

function StatusTab({ overview }: { overview: SwedenOverview }) {
  return (
    <div className={ui.detailGrid}>
      <Bar title="Verksamhetsstatus" items={overview.by_activity_status} missingLabel="Verksamhetsstatus saknas" source="SCB" />
      <Bar title="Bolagsläge / riskläge" items={overview.by_company_state} missingLabel="Bolagsläge saknas" source="Bolagsverket" />
      <Bar title="Arbetsgivarstatus" items={overview.by_employer_status} missingLabel="Arbetsgivarstatus saknas" source="SCB" />
      <Bar title="Momsstatus" items={overview.by_vat_status} missingLabel="Momsstatus saknas" source="SCB" />
      <Bar title="F-skattstatus" items={overview.by_f_tax_status} missingLabel="F-skattstatus saknas" source="SCB" />
      <Bar title="Reklamstatus" items={overview.by_marketing} missingLabel="Reklamstatus saknas" source="SCB · Bolagsverket" />
    </div>
  );
}

export function SwedenInsightSections({ overview }: { overview: SwedenOverview }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  return (
    <div className="space-y-4">
      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} ariaLabel="Sverigeöversikt" />
      <AnimatedContent key={activeTab}>
        {activeTab === "overview" ? <OverviewTab overview={overview} /> : null}
        {activeTab === "geography" ? <GeographyTab overview={overview} /> : null}
        {activeTab === "mix" ? <MixTab overview={overview} /> : null}
        {activeTab === "status" ? <StatusTab overview={overview} /> : null}
      </AnimatedContent>
    </div>
  );
}
