"use client";

import Link from "next/link";
import type { CompaniesResponse } from "@/src/lib/types";
import { ListItem } from "@/src/components/ui/List";
import {
  textLinkGroupedUnderlineClassName,
  textLinkGroupClassName,
} from "@/src/components/ui/TextLink";
import { companyDisplayName } from "@/src/lib/companyNames";
import { companyTypeIcon } from "@/src/lib/companyTypeIcons";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import {
  companyStateLabel,
  companyStateTone,
  companyStatusCardLabel,
  companyStatusTone,
} from "@/src/lib/companyStatus";
import {
  formatOrganizationNumber,
  organizationNumberDigits,
} from "@/src/lib/organizationNumber";
import { formatPostalAddress } from "@/src/lib/postalAddress";
import { CopyToClipboardButton } from "@/src/components/ui/CopyToClipboardButton";
import { StatusChip } from "@/src/components/ui/Chip";
import { SummaryGrid, SummaryItem } from "@/src/components/ui/SummaryGrid";

type CompanyListItemProps = {
  company: CompaniesResponse["items"][number];
  compact?: boolean;
  position?: number;
  onOpen?: () => void;
  mobileActionPlacement?: "top" | "bottom";
};

function CompanyNameLink({
  href,
  company,
  className = "",
  onClick,
}: {
  href: string;
  company: CompaniesResponse["items"][number];
  className?: string;
  onClick?: () => void;
}) {
  const title = companyDisplayName(company);
  const icon = companyTypeIcon(company);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[textLinkGroupClassName, "max-w-full", className].join(" ")}
    >
      <span
        className={[textLinkGroupedUnderlineClassName, "text-base"].join(" ")}
      >
        {title.primary}
      </span>
      {title.secondary ? (
        <span className="min-w-0 truncate font-normal text-app-text-muted">
          {title.secondary}
        </span>
      ) : null}
      <span
        className="inline-flex self-center text-app-text-subtle group-hover:text-app-accent-text"
        title={icon.label}
        aria-label={icon.label}
      >
        <MaskedIcon src={icon.src} className="h-4 w-4" />
      </span>
    </Link>
  );
}

function MatchedName({
  company,
  compact = false,
}: {
  company: CompaniesResponse["items"][number];
  compact?: boolean;
}) {
  if (!company.matched_name?.trim()) return null;
  const displayedName = companyDisplayName(company).primary;
  if (
    displayedName.localeCompare(company.matched_name, "sv-SE", {
      sensitivity: "base",
    }) === 0
  ) {
    return null;
  }

  return (
    <span
      className={[
        "min-w-0 text-app-text-muted",
        compact ? "block truncate text-xs" : "block text-sm",
      ].join(" ")}
      title={`Matchade även: ${company.matched_name}`}
    >
      Matchade även: {company.matched_name}
    </span>
  );
}

export function CompanyListItem({
  company,
  compact = false,
  position,
  onOpen,
  mobileActionPlacement = "bottom",
}: CompanyListItemProps) {
  const companyRef = company.company_id
    ? `id:${company.company_id}`
    : company.pe_org_nr ?? company.org_nr;
  const companyHref = `/company/${encodeURIComponent(companyRef)}`;
  const statusLabel = companyStatusCardLabel(company.activity_status_code);
  const statusTone = companyStatusTone(company.activity_status_code);
  const stateLabel = companyStateLabel(
    company.company_state_code,
    company.company_state,
  );
  const stateTone = companyStateTone(company.company_state_code);
  const postalAddress = formatPostalAddress({
    careOf: company.care_of_address,
    street: company.postal_address,
    postalCode: company.postal_code,
    city: company.postal_city,
  });
  const turnover =
    company.turnover_financial_size ??
    company.turnover_size ??
    "Omsättning saknas";
  const employees = company.employee_size ?? "Anställda saknas";

  const actionMenu = (
    <DropdownMenu
      className={[
        "ml-auto shrink-0",
        mobileActionPlacement === "top" ? "self-start" : "self-end md:self-start",
      ].join(" ")}
      label={`Fler val för ${companyDisplayName(company).primary}`}
      icon={<MaskedIcon src="/icons/utility/dots-vertical.svg" className="h-4 w-4" />}
      triggerVariant="ghost"
      triggerClassName="h-7 min-w-7 px-1.5"
      items={[
        {
          key: "open",
          label: "Till företagssidan",
          href: companyHref,
          onSelect: onOpen,
        },
      ]}
    />
  );

  if (compact) {
    return (
      <ListItem
        as="div"
        compact
        numbered={typeof position === "number"}
        index={position}
      >
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyNameLink
                href={companyHref}
                company={company}
                className="min-w-0"
                onClick={onOpen}
              />
              <span className="shrink-0 text-xs text-app-text-muted">
                Org.nr {formatOrganizationNumber(company.org_nr)}
              </span>
            </div>
            <MatchedName company={company} compact />
          </div>
          {actionMenu}
        </div>
      </ListItem>
    );
  }

  return (
    <ListItem
      as="div"
      numbered={typeof position === "number"}
      index={position}
    >
      <div
        className={[
          "grid min-w-0 gap-3",
          mobileActionPlacement === "top"
            ? "grid-cols-[minmax(0,1fr)_auto] items-start"
            : "md:grid-cols-[minmax(0,1fr)_auto] md:items-start",
        ].join(" ")}
      >
        <div className="min-w-0 space-y-2">
          <CompanyNameLink
            href={companyHref}
            company={company}
            onClick={onOpen}
          />
          <MatchedName company={company} />

          <div className="space-y-0.5 text-sm text-app-text-muted">
            <div className="flex items-center gap-1">
              <span>Org.nr {formatOrganizationNumber(company.org_nr)}</span>
              <CopyToClipboardButton
                value={organizationNumberDigits(company.org_nr)}
                ariaLabel="Kopiera organisationsnummer"
              />
            </div>
            <div>
              <span className="text-app-text-subtle">Postadress:</span>{" "}
              {postalAddress || "-"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusChip tone={statusTone}>{statusLabel}</StatusChip>
            <StatusChip tone={stateTone}>{stateLabel}</StatusChip>
          </div>

          <SummaryGrid columns={3}>
            <SummaryItem label="Bransch" className="col-span-2 sm:col-span-1">
              {company.primary_industry_name ?? "Bransch saknas"}
            </SummaryItem>
            <SummaryItem label="Omsättning">{turnover}</SummaryItem>
            <SummaryItem label="Antal anställda">{employees}</SummaryItem>
          </SummaryGrid>
        </div>

        {actionMenu}
      </div>
    </ListItem>
  );
}
