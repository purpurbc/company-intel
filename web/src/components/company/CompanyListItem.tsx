import Link from "next/link";
import type { ReactNode } from "react";
import type { CompaniesResponse } from "@/src/lib/types";

type CompanyListItemProps = {
  company: CompaniesResponse["items"][number];
  compact?: boolean;
  position?: number;
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-slate-700 bg-slate-950/60 text-slate-300";

  return (
    <span
      className={["rounded-md border px-2 py-1 text-xs", toneClass].join(" ")}
    >
      {children}
    </span>
  );
}

function Position({ value }: { value?: number }) {
  if (typeof value !== "number") return null;

  return (
    <span className="shrink-0 tabular-nums text-slate-600">
      {value.toLocaleString("sv-SE")}
    </span>
  );
}

export function CompanyListItem({
  company,
  compact = false,
  position,
}: CompanyListItemProps) {
  const companyHref = `/company/${encodeURIComponent(company.org_nr)}`;
  const countyHref = company.seat_county_code
    ? `/county/${encodeURIComponent(company.seat_county_code)}`
    : null;
  const municipalityHref = company.seat_municipality_code
    ? `/municipality/${encodeURIComponent(company.seat_municipality_code)}`
    : null;
  const isActive =
    company.company_status_code === "1" ||
    company.company_status_name === "Aktivt";
  const turnover =
    company.turnover_fin_name ??
    company.turnover_gross_name ??
    "Omsättning saknas";
  const employees = company.size_class_name ?? "Anställda saknas";

  if (compact) {
    return (
      <li className="border-b border-slate-800 px-4 py-2.5 transition last:border-b-0 hover:bg-slate-800/40">
        <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 text-sm md:grid-cols-[2.5rem_minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
          <Position value={position} />

          <Link
            href={companyHref}
            className="min-w-0 truncate font-medium text-slate-50 hover:text-white"
          >
            {company.company_name}
          </Link>

          <div className="col-start-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-slate-400 md:col-start-auto md:justify-end">
            <span>{company.org_nr}</span>
            <span className="truncate">
              {municipalityHref ? (
                <Link
                  href={municipalityHref}
                  className="underline decoration-slate-600 underline-offset-4 hover:text-slate-200"
                >
                  {company.seat_municipality_name ?? "-"}
                </Link>
              ) : (
                company.seat_municipality_name ?? "-"
              )}
              {", "}
              {countyHref ? (
                <Link
                  href={countyHref}
                  className="underline decoration-slate-600 underline-offset-4 hover:text-slate-200"
                >
                  {company.seat_county_name ?? "-"}
                </Link>
              ) : (
                company.seat_county_name ?? "-"
              )}
            </span>
            <span>{company.post_ort ?? "-"}</span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="border-b border-slate-800 p-4 transition last:border-b-0 hover:bg-slate-800/40">
      <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[2.5rem_minmax(0,1fr)_auto] md:items-start">
        <div className="pt-1 text-xs">
          <Position value={position} />
        </div>

        <div className="min-w-0 space-y-2">
          <Link
            href={companyHref}
            className="block truncate font-medium text-slate-50 hover:text-white"
          >
            {company.company_name}
          </Link>

          <div className="text-sm text-slate-400">
            {company.org_nr}
            {" | "}
            {municipalityHref ? (
              <Link
                href={municipalityHref}
                className="underline decoration-slate-600 underline-offset-4 hover:text-slate-200"
              >
                {company.seat_municipality_name ?? "-"}
              </Link>
            ) : (
              company.seat_municipality_name ?? "-"
            )}
            {", "}
            {countyHref ? (
              <Link
                href={countyHref}
                className="underline decoration-slate-600 underline-offset-4 hover:text-slate-200"
              >
                {company.seat_county_name ?? "-"}
              </Link>
            ) : (
              company.seat_county_name ?? "-"
            )}
            {" | "}
            {company.post_ort ?? "-"}
          </div>

          <div className="text-sm text-slate-300">
            {company.industry_5_name ?? "Bransch saknas"}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={isActive ? "positive" : "warning"}>
              {isActive ? "Aktivt" : (company.company_status_name ?? "Status saknas")}
            </Badge>
            <Badge>{turnover}</Badge>
            <Badge>{employees}</Badge>
          </div>
        </div>

        <Link
          href={companyHref}
          className="col-start-2 rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-800 md:col-start-auto"
        >
          Öppna
        </Link>
      </div>
    </li>
  );
}
