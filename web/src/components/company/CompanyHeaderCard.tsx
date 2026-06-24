import Link from "next/link";
import type { ReactNode } from "react";
import type { Company } from "@/src/lib/types";

type CompanyHeaderCardProps = {
  company: Company;
};

function text(company: Company, ...keys: string[]) {
  for (const key of keys) {
    const value = company[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return "-";
}

function hrefFromValue(value: unknown, base: string) {
  return typeof value === "string" && value.trim()
    ? `${base}/${encodeURIComponent(value)}`
    : null;
}

function AddressLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) return children;

  return (
    <Link
      href={href}
      className="font-medium text-app-text underline decoration-app-border-strong underline-offset-4 hover:text-app-accent-text"
    >
      {children}
    </Link>
  );
}

export function CompanyHeaderCard({ company }: CompanyHeaderCardProps) {
  const street = text(company, "post_address", "co_address");
  const postNr = text(company, "post_nr");
  const municipality = text(company, "seat_municipality_name", "seat_municipality");
  const county = text(company, "seat_county_name", "seat_county");
  const municipalityHref = hrefFromValue(
    company.seat_municipality_code,
    "/municipality",
  );
  const countyHref = hrefFromValue(company.seat_county_code, "/county");
  const addressParts = [
    street !== "-" ? street : null,
    postNr !== "-" ? postNr : null,
    municipality !== "-" ? (
      <AddressLink key="municipality" href={municipalityHref}>
        {municipality}
      </AddressLink>
    ) : null,
    county !== "-" ? (
      <AddressLink key="county" href={countyHref}>
        {county}
      </AddressLink>
    ) : null,
  ].filter(Boolean);

  return (
    <header className="border-b border-app-border pb-5">
      <h1 className="text-2xl font-semibold text-app-text">
        {company.company_name}
      </h1>
      <div className="mt-2 space-y-0.5 text-sm leading-5 text-app-text-muted">
        <div>Org.nr {company.org_nr}</div>
        <div>
          <span className="font-medium text-app-text-subtle">Adress:</span>{" "}
          {addressParts.length
            ? addressParts.map((part, index) => (
                <span key={index}>
                  {index > 0 ? " · " : null}
                  {part}
                </span>
              ))
            : "-"}
        </div>
      </div>
    </header>
  );
}
