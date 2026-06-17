import Link from "next/link";
import type { ReactNode } from "react";
import type { CompaniesResponse } from "@/src/lib/types";
import { buttonClassName } from "@/src/components/ui/Button";
import { ListItem } from "@/src/components/ui/List";
import {
  companyStatusLabel,
  companyStatusTone,
  statusToneClass,
  type StatusTone,
} from "@/src/lib/companyStatus";

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
  tone?: StatusTone;
}) {
  return (
    <span
      className={[
        "rounded-md border px-2 py-1 text-xs",
        statusToneClass(tone),
      ].join(" ")}
    >
      {children}
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
  const statusLabel = companyStatusLabel(
    company.company_status_code,
    company.company_status_name,
  );
  const statusTone = companyStatusTone(company.company_status_code);
  const turnover =
    company.turnover_fin_name ??
    company.turnover_gross_name ??
    "Omsättning saknas";
  const employees = company.size_class_name ?? "Anställda saknas";

  if (compact) {
    return (
      <ListItem as="div" compact numbered index={position}>
        <div className="grid min-w-0 gap-1 text-sm md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-3">
          <Link
            href={companyHref}
            className="min-w-0 truncate font-medium text-slate-50 hover:text-white"
          >
            {company.company_name}
          </Link>

          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-slate-400 md:justify-end">
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
      </ListItem>
    );
  }

  return (
    <ListItem as="div" numbered index={position}>
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
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
            <Badge tone={statusTone}>{statusLabel}</Badge>
            <Badge>{turnover}</Badge>
            <Badge>{employees}</Badge>
          </div>
        </div>

        <Link
          href={companyHref}
          className={buttonClassName({
            variant: "secondary",
            size: "sm",
            className: "md:col-start-auto",
          })}
        >
          Öppna
        </Link>
      </div>
    </ListItem>
  );
}
