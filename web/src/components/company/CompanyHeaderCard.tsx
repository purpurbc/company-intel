import type { ReactNode } from "react";
import { TextLink } from "@/src/components/ui/TextLink";
import { companyDisplayName } from "@/src/lib/companyNames";
import { companyTypeIcon } from "@/src/lib/companyTypeIcons";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { PageHeader } from "@/src/components/ui/PageHeader";
import type { Company } from "@/src/lib/types";
import { formatPostalAddress } from "@/src/lib/postalAddress";
import {
  formatOrganizationNumber,
  organizationNumberDigits,
} from "@/src/lib/organizationNumber";
import { CopyToClipboardButton } from "@/src/components/ui/CopyToClipboardButton";

type CompanyHeaderCardProps = {
  company: Company;
};

function text(company: Company, ...keys: (keyof Company)[]) {
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
    <TextLink href={href}>
      {children}
    </TextLink>
  );
}

export function CompanyHeaderCard({ company }: CompanyHeaderCardProps) {
  const title = companyDisplayName(company);
  const icon = companyTypeIcon(company);
  const postalAddress = formatPostalAddress({
    careOf: company.care_of_address,
    street: company.postal_address,
    postalCode: company.postal_code,
    city: company.postal_city,
  });
  const municipality = text(company, "municipality_name");
  const county = text(company, "county_name");
  const municipalityHref = hrefFromValue(
    company.municipality_code,
    "/municipality",
  );
  const countyHref = hrefFromValue(company.county_code, "/county");
  const addressParts = [
    postalAddress || null,
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
    <PageHeader
      title={
        <>
        <span className="min-w-0">{title.primary}</span>
        {title.secondary ? (
          <span className="min-w-0 font-normal text-app-text-muted">
            {title.secondary}
          </span>
        ) : null}
        </>
      }
      titleAdornment={
        <span
          className="inline-flex translate-y-0.5 text-app-text-subtle"
          title={icon.label}
          aria-label={icon.label}
        >
          <MaskedIcon src={icon.src} className="h-5 w-5" />
        </span>
      }
      meta={
        <>
        <div className="flex items-center gap-1">
          <span>Org.nr {formatOrganizationNumber(company.org_nr)}</span>
          <CopyToClipboardButton
            value={organizationNumberDigits(company.org_nr)}
            ariaLabel="Kopiera organisationsnummer"
          />
        </div>
        <div>
          <span className="font-medium text-app-text-subtle">Postadress:</span>{" "}
          {addressParts.length
            ? addressParts.map((part, index) => (
                <span key={index}>
                  {index > 0 ? " · " : null}
                  {part}
                </span>
              ))
            : "-"}
        </div>
        </>
      }
    />
  );
}
