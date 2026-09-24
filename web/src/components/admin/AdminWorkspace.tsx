"use client";

import { useState } from "react";

import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import { KpiCard, KpiGrid } from "@/src/components/ui/KpiCard";
import { Feedback } from "@/src/components/ui/Feedback";
import { Section } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import { StatusChip } from "@/src/components/ui/Chip";
import type {
  AdminDataOverview,
  AdminIngestionRun,
  IngestionStatus,
  MetricCoverage,
} from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";
import { FILTER_LABELS } from "@/src/lib/companyFilterLabels";

type TabKey = "overview" | "runs" | "quality" | "search" | "storage";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Översikt" },
  { key: "runs", label: "Importkörningar" },
  { key: "quality", label: "Datakvalitet" },
  { key: "search", label: "Sökning" },
  { key: "storage", label: "Datalager" },
];

const statusLabels: Record<IngestionStatus, string> = {
  done: "Klar",
  partial: "Partiell",
  failed: "Misslyckad",
  running: "Pågår",
  interrupted: "Avbruten",
};

const coverageLabels: Record<string, string> = {
  companies: "Företag",
  active: "Verksamhetsstatus",
  employers: "Arbetsgivarstatus",
  vat_and_f_tax: "Moms + F-skatt",
  counties: "Län",
  municipalities: "Kommun",
  industry_groups: "Bransch",
  company_state: "Bolagsläge",
  aregions: "A-region",
  activity_status: "Verksamhetsstatus",
};

const technicalLabels: Record<string, string> = {
  county_rows: "Teknisk länskod",
  municipality_rows: "Teknisk kommunkod",
  missing_county_rows: "Länskod saknas",
  missing_municipality_rows: "Kommunkod saknas",
};

function sourceName(code: string, fallback: string) {
  if (code === "scb_api" || code === "scb_bulk") return "SCB";
  if (code === "bolagsverket") return "Bolagsverket";
  if (code === "legacy") return "Migrerade äldre data";
  return fallback;
}

function readableMetadataSource(value: string) {
  return value
    .split(",")
    .map((source) => source.trim())
    .map((source) => {
      const normalized = source.toLocaleLowerCase("sv-SE");
      if (normalized.includes("scb")) return "SCB";
      if (normalized.includes("bolagsverket")) return "Bolagsverket";
      if (normalized.includes("migrat")) return "Migrerade äldre data";
      return source;
    })
    .filter((source, index, sources) => sources.indexOf(source) === index)
    .join(" · ");
}

function formatNumber(value: number) {
  return value.toLocaleString("sv-SE");
}

function formatDate(value: string | null, withTime = true) {
  if (!value) return "Saknas";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Europe/Stockholm",
  }).format(date);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
  return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} ${units[index]}`;
}

function StatusBadge({ status }: { status: IngestionStatus }) {
  const tone = status === "done"
    ? "positive"
    : status === "failed"
      ? "danger"
      : status === "running"
        ? "neutral"
        : "warning";
  return <StatusChip tone={tone}>{statusLabels[status]}</StatusChip>;
}

function CoverageRow({ label, metric }: { label: string; metric: MetricCoverage }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-app-border/70 py-2 text-sm last:border-0">
      <div className="min-w-0">
        <div className="font-medium text-app-text">{label}</div>
        <div className="mt-0.5 text-xs text-app-text-subtle">
          {formatNumber(metric.covered)} av {formatNumber(metric.total)} rader har värde
        </div>
      </div>
      <div className="tabular-nums text-app-text-muted">
        {metric.percent === null ? "Saknas" : `${metric.percent.toLocaleString("sv-SE")}%`}
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: AdminDataOverview }) {
  const metadata = data.overview_metadata;
  return (
    <div className="space-y-4">
      <KpiGrid columns="six">
        <KpiCard label="Importkörningar" value={formatNumber(data.summary.runs_total)} />
        <KpiCard label="Klara" value={formatNumber(data.summary.done)} />
        <KpiCard label="Partiella" value={data.summary.partial === undefined ? "Saknas" : formatNumber(data.summary.partial)} />
        <KpiCard label="Misslyckade" value={formatNumber(data.summary.failed)} />
        <KpiCard label="Datakvalitetsfel" value={formatNumber(data.summary.quality_issues_total)} />
        <KpiCard label="Databasstorlek" value={formatBytes(data.summary.database_size_bytes)} />
      </KpiGrid>

      <div className={ui.detailGrid}>
        <Section title="Källor" description="Samlad importstatus per registrerad datakälla.">
          <div className="divide-y divide-app-border/70">
            {data.source_summaries.map((source) => (
              <div key={source.source} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="font-semibold text-app-text">{sourceName(source.source, source.source_name)}</div>
                  <div className="mt-1 text-xs text-app-text-subtle">
                    {source.source} · senaste lyckade {formatDate(source.latest_successful_import_at)}
                  </div>
                </div>
                <div className="text-xs tabular-nums text-app-text-muted sm:text-right">
                  <div>{formatNumber(source.runs)} körningar{source.partial === undefined ? "" : ` · ${formatNumber(source.partial)} partiella`} · {formatNumber(source.failed)} fel</div>
                  <div className="mt-1">{formatNumber(source.records_seen)} lästa rader</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Datatäckning" description="Tekniska mått från senast cachade Sverigeöversikt.">
          {metadata ? (
            <>
              <dl className="grid gap-2 border-b border-app-border pb-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-app-text-subtle">Data per</dt><dd className="font-medium text-app-text">{formatDate(metadata.data_as_of, false)}</dd></div>
                <div><dt className="text-xs text-app-text-subtle">Senaste import</dt><dd className="font-medium text-app-text">{formatDate(metadata.last_successful_import_at)}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-app-text-subtle">Källa</dt><dd className="font-medium text-app-text">{readableMetadataSource(metadata.source)}</dd></div>
              </dl>
              <div className="mt-2">
                {Object.entries(metadata.coverage).map(([key, metric]) => (
                  <CoverageRow key={key} label={coverageLabels[key] ?? key} metric={metric} />
                ))}
              </div>
              {Object.keys(metadata.technical_geography).length ? (
                <div className="mt-3 border-t border-app-border pt-3 text-xs text-app-text-muted">
                  {Object.entries(metadata.technical_geography).map(([key, value]) => (
                    <div key={key}>{technicalLabels[key] ?? key.replaceAll("_", " ")}: {formatNumber(value)} rader</div>
                  ))}
                </div>
              ) : null}
            </>
          ) : <Feedback>Ingen cachad översiktsmetadata finns ännu.</Feedback>}
        </Section>
      </div>
    </div>
  );
}

function RunCard({ run }: { run: AdminIngestionRun }) {
  const coverage = run.metadata.partition_coverage;
  const partitionCoverage = coverage && typeof coverage === "object"
    ? coverage as Record<string, unknown>
    : null;
  const coverageDetail = partitionCoverage
    && typeof partitionCoverage.expected === "number"
    && typeof partitionCoverage.covered === "number"
    && typeof partitionCoverage.insufficient_partitions === "number"
    ? `${formatNumber(partitionCoverage.covered)} av ${formatNumber(partitionCoverage.expected)} enligt SCB:s räkneanrop; ${formatNumber(partitionCoverage.insufficient_partitions)} täckningsavvikelser.`
    : null;
  return (
    <article className="border-b border-app-border py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-app-text">Körning #{run.id} · {sourceName(run.source, run.source_name)}</h3>
            <StatusBadge status={run.status} />
          </div>
          <div className="mt-1 text-xs text-app-text-subtle">
            {run.dataset} · schema {run.schema_version} · start {formatDate(run.started_at)} · {run.metadata.interruption_reconciled === true ? "stopptid okänd" : formatDuration(run.duration_seconds)}
          </div>
        </div>
        <div className="text-xs tabular-nums text-app-text-muted">
          Data per: {formatDate(run.source_as_of_date, false)}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Lästa", run.records_seen],
          ["Nya", run.records_new],
          ["Ändrade", run.records_changed],
          ["Överhoppade", run.records_skipped],
          ["Sista rad", run.last_row_number],
          ["Kvalitetsfel", run.quality_issue_count],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md bg-app-panel-muted p-2">
            <dt className="text-app-text-subtle">{label}</dt>
            <dd className="mt-1 font-semibold tabular-nums text-app-text">{formatNumber(Number(value))}</dd>
          </div>
        ))}
      </dl>

      {run.filename ? <div className="mt-3 break-all text-xs text-app-text-muted">Fil: {run.filename}</div> : null}
      {run.file_checksum ? <div className="mt-1 break-all font-mono text-[11px] text-app-text-subtle">Checksumma: {run.file_checksum}</div> : null}
      {run.status === "partial" ? <Feedback tone="warning" className="mt-3">Ofullständig SCB-import. {coverageDetail}</Feedback> : null}
      {run.error ? <Feedback tone="danger" className="mt-3">{run.error}</Feedback> : null}
    </article>
  );
}

function RunsTab({ data }: { data: AdminDataOverview }) {
  return (
    <Section
      title="Alla importkörningar"
      description={`${formatNumber(data.ingestion_runs.length)} körningar, nyaste först.`}
    >
      {data.ingestion_runs.length ? data.ingestion_runs.map((run) => <RunCard key={run.id} run={run} />) : (
        <Feedback>Inga importkörningar finns registrerade.</Feedback>
      )}
    </Section>
  );
}

function QualityTab({ data }: { data: AdminDataOverview }) {
  return (
    <div className={ui.detailGrid}>
      <Section title="Feltyper" description="Antal registrerade datakvalitetsfel per kod.">
        {data.quality_issues_by_code.length ? (
          <div className="divide-y divide-app-border/70">
            {data.quality_issues_by_code.map((issue) => (
              <div key={issue.issue_code} className="flex justify-between gap-4 py-2 text-sm">
                <span className="font-mono text-xs text-app-text">{issue.issue_code}</span>
                <span className="tabular-nums text-app-text-muted">{formatNumber(issue.count)}</span>
              </div>
            ))}
          </div>
        ) : <Feedback>Inga datakvalitetsfel finns registrerade.</Feedback>}
      </Section>

      <Section title="Senaste fel" description="De 100 senast registrerade problemen.">
        {data.recent_quality_issues.length ? (
          <div className="max-h-[48rem] divide-y divide-app-border/70 overflow-auto pr-2">
            {data.recent_quality_issues.map((issue) => (
              <article key={issue.id} className="py-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono font-semibold text-app-danger-text">{issue.issue_code}</span>
                  <span className="text-app-text-subtle">{formatDate(issue.observed_at)}</span>
                </div>
                <p className="mt-1 break-words leading-5 text-app-text-muted">{issue.detail}</p>
                <div className="mt-1 text-app-text-subtle">
                  Körning #{issue.ingestion_run_id} · {issue.source}{issue.row_number ? ` · rad ${formatNumber(issue.row_number)}` : ""}
                </div>
              </article>
            ))}
          </div>
        ) : <Feedback>Inga datakvalitetsfel finns registrerade.</Feedback>}
      </Section>
    </div>
  );
}

function StorageTab({ data }: { data: AdminDataOverview }) {
  return (
    <div className="space-y-4">
      <Section title="Tabeller" description="PostgreSQL-estimat för rader, skräp och fysisk storlek.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-xs">
            <thead className="border-b border-app-border text-app-text-subtle">
              <tr><th className="py-2 pr-3">Tabell</th><th className="px-3 py-2 text-right">Rader</th><th className="px-3 py-2 text-right">Döda rader</th><th className="px-3 py-2 text-right">Storlek</th><th className="py-2 pl-3">Senast analyserad</th></tr>
            </thead>
            <tbody className="divide-y divide-app-border/70">
              {data.table_stats.map((table) => (
                <tr key={`${table.schema_name}.${table.table_name}`}>
                  <td className="py-2 pr-3 font-mono text-app-text">{table.schema_name}.{table.table_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-app-text-muted">{formatNumber(table.estimated_rows)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-app-text-muted">{formatNumber(table.dead_rows)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-app-text-muted">{formatBytes(table.total_bytes)}</td>
                  <td className="py-2 pl-3 text-app-text-muted">{formatDate(table.last_autoanalyze ?? table.last_analyze)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Översiktscache" description="Generering och giltighet för cachade översikter.">
        <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.cache_entries.map((entry) => (
            <div key={entry.scope} className="grid gap-1 border-b border-app-border/70 py-2 text-xs">
              <span className="min-w-0 truncate font-mono text-app-text">{entry.scope}</span>
              <span className="text-app-text-subtle">
                Genererad {formatDate(entry.generated_at)} · giltig till {formatDate(entry.expires_at)}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SearchTab({ data }: { data: AdminDataOverview }) {
  const metrics = data.search_metrics;
  const percent = (value: number) => `${value.toLocaleString("sv-SE", { maximumFractionDigits: 1 })}%`;
  const milliseconds = (value: number | null) => value === null ? "Saknas" : `${Math.round(value)} ms`;

  return (
    <div className="space-y-4">
      <KpiGrid columns="five">
        <KpiCard label="Sökningar, 7 dagar" value={formatNumber(metrics.data_requests)} />
        <KpiCard label="Svarstid p50" value={milliseconds(metrics.p50_ms)} />
        <KpiCard label="Svarstid p95" value={milliseconds(metrics.p95_ms)} />
        <KpiCard label="Timeoutandel" value={percent(metrics.timeout_percent)} />
        <KpiCard label="Nollträffar" value={percent(metrics.zero_result_percent)} />
      </KpiGrid>

      <div className={ui.detailGrid}>
        <Section title="Sökbeteende">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-app-text-muted">Autocomplete</dt><dd className="font-semibold text-app-text">{formatNumber(metrics.autocomplete_requests)}</dd></div>
            <div><dt className="text-app-text-muted">Omformuleringar</dt><dd className="font-semibold text-app-text">{percent(metrics.reformulation_percent)}</dd></div>
            <div><dt className="text-app-text-muted">Fuzzy fallback</dt><dd className="font-semibold text-app-text">{percent(metrics.fuzzy_percent)}</dd></div>
            <div><dt className="text-app-text-muted">Genomsnitt filter</dt><dd className="font-semibold text-app-text">{metrics.average_filter_count.toLocaleString("sv-SE", { maximumFractionDigits: 1 })}</dd></div>
            <div><dt className="text-app-text-muted">Resultatklick</dt><dd className="font-semibold text-app-text">{formatNumber(metrics.clicks)}</dd></div>
            <div><dt className="text-app-text-muted">Genomsnittlig klickposition</dt><dd className="font-semibold text-app-text">{metrics.average_click_position?.toLocaleString("sv-SE", { maximumFractionDigits: 1 }) ?? "Saknas"}</dd></div>
          </dl>
        </Section>

        <Section title="Använda filter">
          {data.search_filter_usage.length ? (
            <div className="divide-y divide-app-border">
              {data.search_filter_usage.map((item) => (
                <div key={item.filter_key} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-app-text">{FILTER_LABELS[item.filter_key] ?? item.filter_key}</span>
                  <span className="tabular-nums text-app-text-muted">{formatNumber(item.searches)}</span>
                </div>
              ))}
            </div>
          ) : <Feedback>Ingen filteranvändning registrerad ännu.</Feedback>}
        </Section>
      </div>
    </div>
  );
}

export function AdminWorkspace({ data }: { data: AdminDataOverview }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  return (
    <div className="space-y-4">
      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} ariaLabel="Adminvy" />
      <AnimatedContent key={activeTab}>
        {activeTab === "overview" ? <OverviewTab data={data} /> : null}
        {activeTab === "runs" ? <RunsTab data={data} /> : null}
        {activeTab === "quality" ? <QualityTab data={data} /> : null}
        {activeTab === "search" ? <SearchTab data={data} /> : null}
        {activeTab === "storage" ? <StorageTab data={data} /> : null}
      </AnimatedContent>
    </div>
  );
}
