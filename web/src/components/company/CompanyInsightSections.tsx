"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Company, CompanyTurnoverHistoryItem } from "@/src/lib/types";
import { INDUSTRY_OPTIONS } from "@/src/lib/companyFilterOptions";
import {
  companyStateTone,
  companyStatusTone,
  marketingTone,
  statusToneClass,
  type StatusTone,
} from "@/src/lib/companyStatus";

type CompanyInsightSectionsProps = {
  company: Company;
  turnoverHistory?: CompanyTurnoverHistoryItem[];
};

type SignalTone = StatusTone;

type TurnoverRange = {
  min: number;
  max: number;
  label: string;
};

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

function formatTkr(value: number) {
  return `${value.toLocaleString("sv-SE")} tkr`;
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
      <div className="rounded-md border border-dashed border-slate-700 bg-slate-950/30 p-4 text-sm text-slate-500">
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
        ].filter((value): value is number => typeof value === "number");
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
    <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Omsättningshistorik
        </div>
        <button
          type="button"
          onClick={() => setNewestFirst((current) => !current)}
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          aria-pressed={newestFirst}
        >
          {newestFirst ? "Senast vänster" : "Senast höger"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-[4.75rem_minmax(0,1fr)]">
        <div className="relative h-40 border-b border-slate-800">
          <div className="absolute inset-x-0 bottom-0 top-4">
          {axisLabelGroups.map((group) => (
            <span
              key={group.join("-")}
              className="absolute right-3 text-right text-[10px] tabular-nums leading-none text-slate-500"
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
          <div className="relative h-40 w-max min-w-full border-b border-slate-800">
            <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-center gap-8 px-4">
              {axisTicks.map((tickValue) => (
                <span
                  key={tickValue}
                  className="pointer-events-none absolute left-0 right-0 h-px bg-slate-800/80"
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
                    <div className="relative h-full w-10">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md border border-slate-700 bg-slate-800/80"
                        style={{ height: `${grossHeight}%` }}
                      />
                      {finRange ? (
                        <div
                          className="absolute left-1 right-1 rounded-sm bg-emerald-400/85"
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

          <div className="flex w-max min-w-full justify-center gap-8 px-4 pt-3">
            {chartItems.map((item) => (
              <div
                key={item.year}
                className="w-16 shrink-0 text-center text-sm font-medium text-slate-100"
              >
                {item.year}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-4 rounded-sm bg-slate-800 ring-1 ring-slate-700" />
          Grov omsättningsklass
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-4 rounded-sm bg-emerald-400/85" />
          Fin omsättningsklass
        </span>
      </div>
    </div>
  );
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

function industryGroup(company: Company) {
  const code = text(company, "bransch_1_code")?.slice(0, 2);
  if (!code) return null;

  const option = INDUSTRY_OPTIONS.find((item) => item.value === code);
  return option ? `${code} ${option.label}` : code;
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
    tone === "neutral"
      ? "border-slate-800 bg-slate-950/50 text-slate-300"
      : statusToneClass(tone);

  return (
    <div className={["rounded-md border p-3", toneClass].join(" ")}>
      <div className="text-sm font-medium">{label}</div>
      {detail ? <div className="mt-1 text-xs opacity-75">{detail}</div> : null}
    </div>
  );
}

function registrationTone(code: string | null): SignalTone {
  if (!code) return "neutral";
  return code === "1" ? "positive" : "warning";
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
  const fTaxCode = text(company, "f_tax_status_code");
  const vatCode = text(company, "vat_status_code");
  const employerCode = text(company, "employer_status_code");
  const marketingCode = text(company, "reklam_code");
  const companyStateCode = text(company, "company_state_code");
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
        tone={registrationTone(fTaxCode)}
      />
      <Signal
        label="Momsregistrerat"
        detail={text(company, "vat_status") ?? "Uppgift saknas"}
        tone={registrationTone(vatCode)}
      />
      <Signal
        label="Arbetsgivare"
        detail={text(company, "employer_status") ?? "Uppgift saknas"}
        tone={registrationTone(employerCode)}
      />
      <Signal
        label="Tar emot reklam"
        detail={text(company, "reklam", "utskick") ?? "Uppgift saknas"}
        tone={marketingTone(marketingCode)}
      />
      <Signal
        label="Export/import"
        detail={exportImport ?? "Ingen signal"}
        tone={exportImport ? "positive" : "neutral"}
      />
      <Signal
        label="Status"
        detail={text(company, "company_status", "company_status_name_dim") ?? "Uppgift saknas"}
        tone={companyStatusTone(text(company, "company_status_code"))}
      />
      <Signal
        label="Risksignaler"
        detail={text(company, "company_state", "company_state_name_dim") ?? "Inga tydliga signaler"}
        tone={companyStateTone(companyStateCode)}
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

export function CompanyInsightSections({
  company,
  turnoverHistory = [],
}: CompanyInsightSectionsProps) {
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);
  const industryGroupName = industryGroup(company);

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
                  <CountyOverviewLink href={municipalityOverviewHref}>
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
              { label: "SNI-grupp", value: industryGroupName },
              { label: "Avdelning", value: text(company, "avdelning_1", "avdelning_1_name_dim") },
              { label: "Segment", value: text(company, "industry_2_name") },
              { label: "Storleksklass", value: text(company, "size_class", "size_class_name_dim") },
              { label: "Antal firmor", value: text(company, "num_firms") },
            ]}
          />
        </SectionCard>

        <SectionCard title="Ekonomi">
          <div className="space-y-4">
            <TurnoverHistoryChart items={turnoverHistory} />
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
          </div>
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
