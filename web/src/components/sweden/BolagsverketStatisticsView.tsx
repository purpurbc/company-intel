"use client";

import { useState } from "react";

import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import {
  DataVisualization,
  type DataChartConfig,
} from "@/src/components/ui/DataVisualization";
import {
  type DataTableColumn,
} from "@/src/components/ui/DataTable";
import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { KpiCard, KpiGrid } from "@/src/components/ui/KpiCard";
import { Section } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import type { BolagsverketStatisticsOverview } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

type StatisticsTab = "companies" | "representatives" | "audit" | "filing";

const tabs: Array<{ key: StatisticsTab; label: string }> = [
  { key: "companies", label: "Företag" },
  { key: "representatives", label: "Företrädare" },
  { key: "audit", label: "Revision" },
  { key: "filing", label: "Årsredovisning" },
];

const numericColumn = { align: "right" as const };

const companyColumns: DataTableColumn[] = [
  { key: "period", label: "Period" },
  { key: "registered", label: "Nya", ...numericColumn },
  { key: "closed", label: "Avslutade", ...numericColumn },
  { key: "net", label: "Netto", ...numericColumn },
  { key: "total", label: "Totalt", ...numericColumn },
];

const representativeColumns: DataTableColumn[] = [
  { key: "year", label: "År" },
  { key: "chiefExecutives", label: "VD", ...numericColumn },
  { key: "boardMembers", label: "Ledamöter", ...numericColumn },
  { key: "chairpersons", label: "Ordförande", ...numericColumn },
  { key: "deputies", label: "Suppleanter", ...numericColumn },
];

const auditorColumns: DataTableColumn[] = [
  { key: "year", label: "År" },
  { key: "type", label: "Typ" },
  { key: "companies", label: "Bolag", ...numericColumn },
  { key: "auditor", label: "Revisor vid bildning", ...numericColumn },
  { key: "reservation", label: "Med förbehåll", ...numericColumn },
  { key: "withoutAuditor", label: "Utan revisor, med förbehåll", ...numericColumn },
];

const filingColumns: DataTableColumn[] = [
  { key: "year", label: "År" },
  { key: "expected", label: "Ska lämna", ...numericColumn },
  { key: "filed", label: "Inkomna", ...numericColumn },
  { key: "filedShare", label: "Andel inkomna", ...numericColumn },
  { key: "lateFees", label: "Förseningsavgift", ...numericColumn },
  { key: "lateFeeShare", label: "Andel", ...numericColumn },
];

const companyChart: DataChartConfig = {
  xKey: "period",
  series: [
    { key: "registered", label: "Nya" },
    { key: "closed", label: "Avslutade" },
    { key: "net", label: "Netto", format: "signed" },
    { key: "total", label: "Totalt" },
  ],
  defaultVisibleKeys: ["registered", "closed", "net"],
};

const representativeChart: DataChartConfig = {
  xKey: "year",
  series: [
    { key: "chiefExecutives", label: "VD" },
    { key: "boardMembers", label: "Ledamöter" },
    { key: "chairpersons", label: "Ordförande" },
    { key: "deputies", label: "Suppleanter" },
  ],
};

const auditorChart: DataChartConfig = {
  xKey: "year",
  groupKey: "type",
  xOptions: [
    { key: "year", label: "År", groupKey: "type" },
    { key: "type", label: "Typ", groupKey: "year", categorical: true },
  ],
  series: [
    { key: "companies", label: "Bolag" },
    { key: "auditor", label: "Revisor vid bildning" },
    { key: "reservation", label: "Med förbehåll" },
    { key: "withoutAuditor", label: "Utan revisor, med förbehåll" },
  ],
  modes: ["bar", "line", "spline"],
  defaultMode: "bar",
  defaultVisibleKeys: ["companies"],
};

const filingChart: DataChartConfig = {
  xKey: "year",
  series: [
    { key: "expected", label: "Ska lämna" },
    { key: "filed", label: "Inkomna" },
    {
      key: "filedShare",
      label: "Andel inkomna",
      axis: "secondary",
      format: "percent",
    },
    { key: "lateFees", label: "Förseningsavgift" },
    {
      key: "lateFeeShare",
      label: "Andel med förseningsavgift",
      axis: "secondary",
      format: "percent",
    },
  ],
  defaultVisibleKeys: ["expected", "filed", "lateFees"],
};

function formatNumber(value: number | null) {
  return value === null ? "Saknas" : value.toLocaleString("sv-SE");
}

function formatSignedNumber(value: number | null) {
  if (value === null) return "Saknas";
  const formatted = Math.abs(value).toLocaleString("sv-SE");
  return value > 0 ? `+${formatted}` : value < 0 ? `−${formatted}` : "0";
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("sv-SE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function CompaniesTab({ data }: { data: BolagsverketStatisticsOverview }) {
  const rows = data.company_dynamics.map((point) => ({
    key: point.period,
    cells: {
      period: formatMonth(point.period),
      registered: formatNumber(point.registered),
      closed: formatNumber(point.closed),
      net: formatSignedNumber(point.net_change),
      total: formatNumber(point.total_registered),
    },
    sortValues: {
      period: point.period,
      registered: point.registered,
      closed: point.closed,
      net: point.net_change,
      total: point.total_registered,
    },
  }));

  return (
    <div className={ui.detailGrid}>
      <Section
        title="Företagsdynamik"
        description="Nationella månadsuppgifter om nyregistrerade, avslutade och totalt registrerade företag och föreningar."
        source="Bolagsverket · CC BY 2.5 SE"
      >
        <DataVisualization
          caption="Nyregistrerade, avslutade och registrerade företag per månad"
          columns={companyColumns}
          chart={companyChart}
          sortable
          rows={rows}
        />
      </Section>
      <HorizontalBarList
        title="Företagsformer"
        items={data.company_forms}
        maxItems={10}
        previewItems={10}
        source="Bolagsverket · CC BY 2.5 SE"
      />
    </div>
  );
}

function RepresentativesTab({ data }: { data: BolagsverketStatisticsOverview }) {
  const rows = data.representative_history.map((point) => ({
    key: String(point.year),
    cells: {
      year: point.year,
      chiefExecutives: formatNumber(point.chief_executives),
      boardMembers: formatNumber(point.board_members),
      chairpersons: formatNumber(point.chairpersons),
      deputies: formatNumber(point.deputies),
    },
    sortValues: {
      year: point.year,
      chiefExecutives: point.chief_executives,
      boardMembers: point.board_members,
      chairpersons: point.chairpersons,
      deputies: point.deputies,
    },
  }));

  return (
    <div className={ui.detailGrid}>
      <Section
        title="Företrädarroller"
        description="Registrerade rollposter, inte unika personer."
        source="Bolagsverket · CC BY 2.5 SE"
      >
        <DataVisualization
          caption="Registrerade företrädarroller per år"
          columns={representativeColumns}
          chart={representativeChart}
          sortable
          rows={rows}
        />
      </Section>
      <HorizontalBarList
        title="Vanligaste roller"
        items={data.representative_roles}
        maxItems={10}
        previewItems={10}
        source="Bolagsverket · CC BY 2.5 SE"
      />
    </div>
  );
}

function AuditTab({ data }: { data: BolagsverketStatisticsOverview }) {
  const rows = data.auditor_reservations.map((point) => ({
    key: `${point.year}-${point.formation_type_code}`,
    cells: {
      year: point.year,
      type: point.formation_type_name,
      companies: formatNumber(point.company_count),
      auditor: formatNumber(point.with_auditor_at_formation_count),
      reservation: `${formatNumber(point.with_auditor_reservation_count)} · ${formatPercent(point.with_auditor_reservation_share)}`,
      withoutAuditor: `${formatNumber(point.without_auditor_with_reservation_count)} · ${formatPercent(point.without_auditor_with_reservation_share)}`,
    },
    sortValues: {
      year: point.year,
      type: point.formation_type_name,
      companies: point.company_count,
      auditor: point.with_auditor_at_formation_count,
      reservation: point.with_auditor_reservation_count,
      withoutAuditor: point.without_auditor_with_reservation_count,
    },
  }));

  return (
    <Section
      title="Revisorsförbehåll"
      description="Nyregistrerade aktiebolag per registreringsår och bildningssätt. Förbehåll visas som antal · andel."
      source="Bolagsverket · CC BY 2.5 SE"
    >
      <DataVisualization
        caption="Revisorsförbehåll för nyregistrerade aktiebolag"
        columns={auditorColumns}
        chart={auditorChart}
        sortable
        rows={rows}
      />
    </Section>
  );
}

function FilingTab({ data }: { data: BolagsverketStatisticsOverview }) {
  const rows = data.filing_delays.map((point) => ({
    key: String(point.year),
    cells: {
      year: point.year,
      expected: formatNumber(point.expected_to_file_count),
      filed: formatNumber(point.filed_annual_report_count),
      filedShare: formatPercent(point.filed_annual_report_share),
      lateFees: formatNumber(point.late_fee_count),
      lateFeeShare: formatPercent(point.late_fee_share),
    },
    sortValues: {
      year: point.year,
      expected: point.expected_to_file_count,
      filed: point.filed_annual_report_count,
      filedShare: point.filed_annual_report_share,
      lateFees: point.late_fee_count,
      lateFeeShare: point.late_fee_share,
    },
  }));

  return (
    <Section
      title="Årsredovisningar och förseningsavgifter"
      description="Nationella årsuppgifter om inkomna årsredovisningar och beslutade förseningsavgifter."
      source="Bolagsverket · CC BY 2.5 SE"
    >
      <DataVisualization
        caption="Inkomna årsredovisningar och förseningsavgifter per år"
        columns={filingColumns}
        chart={filingChart}
        sortable
        rows={rows}
      />
    </Section>
  );
}

export function BolagsverketStatisticsView({
  data,
}: {
  data: BolagsverketStatisticsOverview;
}) {
  const [activeTab, setActiveTab] = useState<StatisticsTab>("companies");
  const latest = data.company_dynamics[0];

  return (
    <div className="space-y-4">
      <KpiGrid columns="four">
        <KpiCard
          label="Nyregistrerade"
          value={formatNumber(latest?.registered ?? null)}
          detail={latest ? formatMonth(latest.period) : undefined}
        />
        <KpiCard
          label="Avslutade"
          value={formatNumber(latest?.closed ?? null)}
          detail={latest ? formatMonth(latest.period) : undefined}
        />
        <KpiCard
          label="Netto"
          value={formatSignedNumber(latest?.net_change ?? null)}
          detail={latest ? formatMonth(latest.period) : undefined}
        />
        <KpiCard
          label="Registrerade totalt"
          value={formatNumber(latest?.total_registered ?? null)}
          detail={latest ? formatMonth(latest.period) : undefined}
        />
      </KpiGrid>

      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Bolagsverkets statistik"
      />

      <AnimatedContent key={activeTab}>
        {activeTab === "companies" ? <CompaniesTab data={data} /> : null}
        {activeTab === "representatives" ? <RepresentativesTab data={data} /> : null}
        {activeTab === "audit" ? <AuditTab data={data} /> : null}
        {activeTab === "filing" ? <FilingTab data={data} /> : null}
      </AnimatedContent>
    </div>
  );
}
