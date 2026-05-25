import Link from "next/link";
import type { Company } from "@/src/lib/types";

type CompanyHeaderCardProps = {
  company: Company;
};

function display(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "-";
}

function statusBadge(label: string, active: boolean) {
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-slate-700 bg-slate-900 text-slate-400",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function countyHref(company: Company) {
  const countyCode = company.seat_county_code;
  return typeof countyCode === "string" && countyCode.trim()
    ? `/county/${encodeURIComponent(countyCode)}`
    : null;
}

function municipalityHref(company: Company) {
  const municipalityCode = company.seat_municipality_code;
  return typeof municipalityCode === "string" && municipalityCode.trim()
    ? `/municipality/${encodeURIComponent(municipalityCode)}`
    : null;
}

export function CompanyHeaderCard({ company }: CompanyHeaderCardProps) {
  const isActive =
    company.company_status_code === "1" ||
    company.company_status === "Aktivt" ||
    company.company_status_name_dim === "Aktivt";

  const isEmployer =
    company.employer_status_code === "1" ||
    company.employer_status === "Arbetsgivare";
  const countyOverviewHref = countyHref(company);
  const municipalityOverviewHref = municipalityHref(company);
  const municipality = display(
    company.seat_municipality_name ?? company.seat_municipality,
  );
  const county = display(company.seat_county_name ?? company.seat_county);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Företagsprofil
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
              {company.company_name}
            </h1>
            <p className="text-sm text-slate-400">Org.nr {company.org_nr}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusBadge(isActive ? "Aktivt" : "Status okänd", isActive)}
            {statusBadge(
              isEmployer ? "Arbetsgivare" : "Ej verifierad arbetsgivare",
              isEmployer,
            )}
            {statusBadge(
              display(company.private_public) as string,
              Boolean(company.private_public),
            )}
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 lg:min-w-80">
          <div className="font-medium text-slate-100">
            {display(company.bransch_1)}
          </div>
          <div className="mt-2 text-slate-400">
            {countyOverviewHref || municipalityOverviewHref ? (
              <>
                {municipalityOverviewHref ? (
                  <Link
                    href={municipalityOverviewHref}
                    className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-white"
                  >
                    {municipality}
                  </Link>
                ) : (
                  municipality
                )}
                {", "}
                {countyOverviewHref ? (
                  <Link
                    href={countyOverviewHref}
                    className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-white"
                  >
                    {county}
                  </Link>
                ) : (
                  county
                )}
              </>
            ) : (
              <>
                {municipality}
                {", "}
                {county}
              </>
            )}
          </div>
          <div className="mt-1 text-slate-500">{display(company.post_ort)}</div>
        </div>
      </div>
    </section>
  );
}
