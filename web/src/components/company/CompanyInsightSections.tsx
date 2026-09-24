"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { buttonClassName } from "@/src/components/ui/Button";
import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import { DataVisualization, type DataChartSeries } from "@/src/components/ui/DataVisualization";
import { Feedback } from "@/src/components/ui/Feedback";
import { TextLink } from "@/src/components/ui/TextLink";
import { Inset, Section } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import type {
  Company,
  CompanyEventHistoryItem,
  CompanyTurnoverHistoryItem,
} from "@/src/lib/types";
import { INDUSTRY_OPTIONS } from "@/src/lib/companyFilterOptions";
import { ui } from "@/src/lib/uiStyles";
import { formatDataSources } from "@/src/lib/dataSources";
import { formatPostalAddress } from "@/src/lib/postalAddress";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

type CompanyInsightSectionsProps = {
  company: Company;
  turnoverHistory?: CompanyTurnoverHistoryItem[];
  eventHistory?: CompanyEventHistoryItem[];
};

type TabKey = "overview" | "events" | "contact" | "raw";

type TurnoverRange = {
  min: number;
  max: number;
  label: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Översikt" },
  { key: "events", label: "Händelser" },
  { key: "contact", label: "Kontakt" },
  { key: "raw", label: "Rådata" },
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

function value(company: Company, key: keyof Company): unknown {
  return company[key];
}

function text(company: Company, ...keys: (keyof Company)[]): string | null {
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

function countyHref(company: Company) {
  const countyCode = text(company, "county_code");
  return countyCode ? `/county/${encodeURIComponent(countyCode)}` : null;
}

function municipalityHref(company: Company) {
  const municipalityCode = text(company, "municipality_code");
  return municipalityCode
    ? `/municipality/${encodeURIComponent(municipalityCode)}`
    : null;
}

function municipalityMapHref(company: Company) {
  const municipalityCode = text(company, "municipality_code");
  return municipalityCode
    ? `/map?municipality=${encodeURIComponent(municipalityCode)}`
    : "/map";
}

function industryGroup(company: Company) {
  const code = text(company, "primary_industry_code")?.slice(0, 2);
  if (!code) return null;

  const option = INDUSTRY_OPTIONS.find((item) => item.value === code);
  return option ? `${code} ${option.label}` : code;
}

function companySources(
  company: Company,
  fields: Array<keyof Company>,
  fallback?: string,
  additionalSources: string[] = [],
) {
  return formatDataSources(
    [
      ...fields.map((field) => company.provenance?.[field]?.source),
      ...additionalSources,
    ],
    fallback,
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

function SectionBlock({
  title,
  children,
  className = "",
  bodyClassName = "",
  source,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  source?: string;
}) {
  return (
    <Section title={title} source={source} className={className} contentClassName={bodyClassName}>
      {children}
    </Section>
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
          className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 text-xs sm:grid-cols-[11.5rem_minmax(0,1fr)]"
        >
          <dt className="min-w-0 break-words text-[11px] font-medium uppercase leading-4 text-app-text-subtle">
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

function registrationStatus(
  code: string | null,
  registeredCodes: string[],
): boolean | null {
  if (!code) return null;
  return registeredCodes.includes(code);
}

function RegistrySummary({ company }: { company: Company }) {
  const entries = [
    {
      label: "Moms",
      registered: registrationStatus(company.vat_status_code, ["1", "3"]),
      detail: company.vat_status,
    },
    {
      label: "F-skatt",
      registered: registrationStatus(company.f_tax_status_code, ["1"]),
      detail: company.f_tax_status,
    },
    {
      label: "Arbetsgivare",
      registered: registrationStatus(company.employer_status_code, ["1", "2", "3", "4"]),
      detail: company.employer_status,
    },
  ];

  return (
    <span className="flex flex-wrap gap-x-4 gap-y-2">
      {entries.map((entry) => {
        const statusLabel =
          entry.registered === null
            ? "uppgift saknas"
            : entry.registered
              ? "registrerad"
              : "inte registrerad";
        const tone =
          entry.registered === null
            ? "text-app-text-subtle"
            : entry.registered
              ? "text-app-positive-bg"
              : "text-app-danger-bg";

        return (
          <span
            key={entry.label}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
            title={`${entry.label}: ${entry.detail || statusLabel}`}
            aria-label={`${entry.label}: ${statusLabel}`}
          >
            <MaskedIcon
              src={
                entry.registered === true
                  ? "/icons/utility/check-circle.svg"
                  : "/icons/utility/cross.svg"
              }
              className={`h-4 w-4 ${tone}`}
            />
            <span>{entry.label}</span>
          </span>
        );
      })}
    </span>
  );
}

function TurnoverHistory({
  items = [],
}: {
  items?: CompanyTurnoverHistoryItem[];
}) {
  const chartItems = items
    .map((item) => {
      const grossRange = item.turnover_size_code
        ? TURNOVER_GROSS_RANGES[item.turnover_size_code]
        : null;
      const finRange = item.turnover_financial_size_code
        ? TURNOVER_FIN_RANGES[item.turnover_financial_size_code]
        : null;

      return {
        ...item,
        grossRange,
        finRange,
      };
    })
    .filter((item) => item.grossRange || item.finRange)
    .sort((a, b) => a.year - b.year);

  if (chartItems.length === 0) {
    return (
      <Feedback>
        Ingen omsättningshistorik finns ännu.
      </Feedback>
    );
  }

  const midpoint = (range: TurnoverRange | null) =>
    range ? (range.min + range.max) / 2 : null;
  const series: DataChartSeries[] = [
    ...(chartItems.some((item) => item.finRange)
      ? [{ key: "fine", label: "Fin klass", useCellLabel: true }]
      : []),
    ...(chartItems.some((item) => item.grossRange)
      ? [{ key: "gross", label: "Grov klass", useCellLabel: true }]
      : []),
  ];

  return (
    <Inset>
      <div className="mb-2 text-xs font-medium uppercase text-app-text-subtle">
        Omsättningshistorik
      </div>
      <DataVisualization
        caption="Omsättningshistorik per år i tusen kronor"
        defaultView="chart"
        sortable
        chart={{ xKey: "year", modes: ["line", "spline", "bar"], series }}
        columns={[
          { key: "year", label: "År" },
          { key: "fine", label: "Fin klass" },
          { key: "gross", label: "Grov klass" },
        ]}
        rows={chartItems.map((item) => ({
          key: String(item.year),
          cells: {
            year: item.year,
            fine: item.finRange?.label ?? item.turnover_financial_size ?? "Saknas",
            gross: item.grossRange?.label ?? item.turnover_size ?? "Saknas",
          },
          sortValues: {
            year: item.year,
            fine: midpoint(item.finRange),
            gross: midpoint(item.grossRange),
          },
        }))}
      />
      <p className="mt-2 text-xs text-app-text-subtle">
        Diagrammet visar klassernas mittpunkter i tkr, inte exakta belopp. Öppna klasser visas vid sin nedre gräns.
      </p>
    </Inset>
  );
}

function OverviewTab({
  company,
  turnoverHistory,
}: CompanyInsightSectionsProps) {
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);
  const mapHref = municipalityMapHref(company);
  const industryGroupName = industryGroup(company);
  const businessDescription = company.business_description?.trim() || null;
  const postalAddress = formatPostalAddress({
    careOf: company.care_of_address,
    street: company.postal_address,
    postalCode: company.postal_code,
    city: company.postal_city,
  });
  return (
    <div className="space-y-3">
      <div className={ui.detailGrid}>
        <SectionBlock
          title="Företagsinformation"
          source={companySources(
            company,
            [
              "organization_form_code", "legal_form_code", "activity_status_code",
              "company_state_code", "workplace_count", "private_public_code",
              "sector_code", "vat_status_code", "f_tax_status_code",
              "employer_status_code",
            ],
            "SCB · Bolagsverket",
            ["bolagsverket"],
          )}
        >
          <DataGrid
            rows={[
              { label: "Verksamhetsform", value: text(company, "organization_form") },
              { label: "Juridisk form", value: text(company, "legal_form") },
              {
                label: "Registreringsdatum",
                value: formatDate(company.bolagsverket_registration_date),
              },
              { label: "Verksamhetsstatus", value: text(company, "activity_status") },
              { label: "Bolagsläge / riskläge", value: text(company, "company_state") },
              { label: "Registrerat för", value: <RegistrySummary company={company} /> },
              { label: "Arbetsställen", value: text(company, "workplace_count") },
              { label: "Privat/offentligt", value: text(company, "private_public") },
              { label: "Sektor", value: text(company, "sector") },
            ]}
          />
        </SectionBlock>

        <SectionBlock
          title="Verksamhet"
          source={companySources(
            company,
            ["primary_industry_code", "industry_section_code", "employee_size_code"],
            businessDescription ? "SCB · Bolagsverket" : "SCB",
            businessDescription ? ["bolagsverket"] : [],
          )}
        >
          <DataGrid
            rows={[
              { label: "Bransch", value: text(company, "primary_industry_name") },
              { label: "SNI-kod", value: text(company, "primary_industry_code") },
              { label: "SNI-grupp", value: industryGroupName },
              { label: "Avdelning", value: text(company, "industry_section_name") },
              { label: "Anställda", value: text(company, "employee_size") },
            ]}
          />
          {businessDescription ? (
            <div className="mt-3 border-t border-app-border pt-3">
              <div className="text-[11px] font-medium uppercase text-app-text-subtle">
                Verksamhetsbeskrivning
              </div>
              <p className="mt-2 text-sm leading-6 text-app-text">
                {businessDescription}
              </p>
            </div>
          ) : null}
        </SectionBlock>
      </div>

      <SectionBlock
        title="Ekonomi"
        source={companySources(
          company,
          ["turnover_size_code", "turnover_financial_size_code", "turnover_year", "sme_size_code", "trade_indicator"],
          "SCB",
        )}
      >
        <div className="space-y-3">
          <TurnoverHistory items={turnoverHistory} />
          <DataGrid
            rows={[
              { label: "Omsättning", value: text(company, "turnover_size") },
              { label: "Fin omsättning", value: text(company, "turnover_financial_size") },
              { label: "Omsättningsår", value: text(company, "turnover_year") },
              { label: "SMF-klass", value: text(company, "sme_size") },
              { label: "Handel", value: text(company, "trade_indicator") },
            ]}
          />
        </div>
      </SectionBlock>

      <SectionBlock
        title="Geografi"
        source={companySources(
          company,
          ["municipality_code", "county_code", "region_code", "postal_address", "postal_code", "postal_city"],
        )}
      >
        <DataGrid
          rows={[
            {
              label: "Kommun",
              value: (
                <LinkedValue href={municipalityOverviewHref}>
                  {text(company, "municipality_name")}
                </LinkedValue>
              ),
            },
            {
              label: "Län",
              value: (
                <LinkedValue href={countyOverviewHref}>
                  {text(company, "county_name")}
                </LinkedValue>
              ),
            },
            { label: "Region", value: text(company, "region_name") },
            { label: "Postadress", value: postalAddress || null },
          ]}
        />
        <div className="mt-3 border-t border-app-border pt-3">
          <Link
            href={mapHref}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            Visa kommun på karta
          </Link>
        </div>
      </SectionBlock>
    </div>
  );
}

function ContactTab({ company }: CompanyInsightSectionsProps) {
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);
  const postalAddress = formatPostalAddress({
    careOf: company.care_of_address,
    street: company.postal_address,
    postalCode: company.postal_code,
    city: company.postal_city,
  });

  return (
    <div className={ui.detailGrid}>
      <SectionBlock
        title="Kontakt"
        source={companySources(company, ["phone", "email", "advertising_status_code"], "SCB")}
      >
        <DataGrid
          rows={[
            { label: "Telefon", value: text(company, "phone") },
            { label: "E-post", value: text(company, "email") },
            { label: "Reklam", value: text(company, "advertising_status") },
          ]}
        />
      </SectionBlock>

      <SectionBlock
        title="Adress"
        source={companySources(
          company,
          ["postal_address", "postal_code", "postal_city", "municipality_code", "county_code"],
        )}
      >
        <DataGrid
          rows={[
            { label: "Postadress", value: postalAddress || null },
            {
              label: "Kommun",
              value: (
                <LinkedValue href={municipalityOverviewHref}>
                  {text(company, "municipality_name")}
                </LinkedValue>
              ),
            },
            {
              label: "Län",
              value: (
                <LinkedValue href={countyOverviewHref}>
                  {text(company, "county_name")}
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
    <SectionBlock title="Rådata">
      <pre className="max-h-[32rem] overflow-auto rounded-sm bg-app-panel-muted p-3 text-xs leading-5 text-app-text-muted">
        {JSON.stringify(company, null, 2)}
      </pre>
    </SectionBlock>
  );
}

function eventDate(event: CompanyEventHistoryItem) {
  return event.effective_at ?? event.detected_at;
}

function eventKindLabel(kind: CompanyEventHistoryItem["kind"]) {
  switch (kind) {
    case "company_event":
      return "Händelse";
    case "change":
      return "Ändring";
    case "registration":
      return "Registrering";
    case "procedure":
      return "Förfarande";
    default:
      return kind;
  }
}

const EVENT_KIND_ICONS: Record<CompanyEventHistoryItem["kind"], string> = {
  company_event: "/icons/event/company_event.svg",
  change: "/icons/event/change.svg",
  registration: "/icons/event/registration.svg",
  procedure: "/icons/event/procedure.svg",
};

function eventKindClassName(kind: CompanyEventHistoryItem["kind"]) {
  switch (kind) {
    case "company_event":
      return "bg-app-positive-bg text-app-positive-text";
    case "change":
      return "bg-app-info-bg text-app-info-text";
    case "registration":
      return "bg-app-event-registration-bg text-app-event-registration-text";
    case "procedure":
      return "bg-app-warning-bg text-app-warning-text";
    default:
      return "bg-app-panel-muted text-app-text-muted";
  }
}

function EventTimeline({ items = [] }: { items?: CompanyEventHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <Feedback>
        Inga historikhändelser finns ännu.
      </Feedback>
    );
  }

  return (
    <div className="divide-y divide-app-border">
      {items.map((event) => {
        const date = eventDate(event);

        return (
          <article key={event.id} className="grid gap-3 py-3 md:grid-cols-[8rem_minmax(0,1fr)]">
            <div className="text-xs text-app-text-subtle">
              <div className="font-medium text-app-text-muted">
                {formatDate(date)}
              </div>
              <div className="mt-1">
                {event.effective_at ? "Händelsedatum" : "Upptäckt i data"}
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span
                    className={[
                      "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold leading-none",
                      eventKindClassName(event.kind),
                    ].join(" ")}
                  >
                    <MaskedIcon
                      src={EVENT_KIND_ICONS[event.kind]}
                      className="h-3.5 w-3.5"
                    />
                    {eventKindLabel(event.kind)}
                  </span>
                  <h3 className="min-w-0 text-sm font-semibold text-app-text">
                    {event.title}
                  </h3>
                </div>
                {event.description ? (
                  <p className="mt-1 text-sm leading-6 text-app-text-muted">
                    {event.description}
                  </p>
                ) : null}
                {event.source_label || (event.detected_at && event.effective_at) ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-app-text-subtle">
                    {event.source_label ? (
                      <span>Källa: {event.source_label}</span>
                    ) : null}
                    {event.source_label && event.detected_at && event.effective_at ? (
                      <span aria-hidden="true">·</span>
                    ) : null}
                    {event.detected_at && event.effective_at ? (
                      <span>Inläst {formatDate(event.detected_at)}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EventsTab({ eventHistory = [] }: CompanyInsightSectionsProps) {
  return (
    <SectionBlock
      title="Tidslinje"
      source={formatDataSources(eventHistory.map((event) => event.source))}
    >
      <EventTimeline items={eventHistory} />
    </SectionBlock>
  );
}

export function CompanyInsightSections({
  company,
  turnoverHistory = [],
  eventHistory = [],
}: CompanyInsightSectionsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-3">
      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Företagsvy"
      />

      <AnimatedContent key={activeTab}>
        {activeTab === "overview" ? (
          <OverviewTab company={company} turnoverHistory={turnoverHistory} />
        ) : null}
        {activeTab === "events" ? (
          <EventsTab company={company} eventHistory={eventHistory} />
        ) : null}
        {activeTab === "contact" ? <ContactTab company={company} /> : null}
        {activeTab === "raw" ? <RawTab company={company} /> : null}
      </AnimatedContent>
    </div>
  );
}
