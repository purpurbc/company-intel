import {
  getCompany,
  getCompanyEventHistory,
  getCompanyTurnoverHistory,
} from "@/src/lib/api";
import { notFound } from "next/navigation";

import { CompanyHeaderCard } from "@/src/components/company/CompanyHeaderCard";
import { CompanyInsightSections } from "@/src/components/company/CompanyInsightSections";
import { Page } from "@/src/components/ui/Page";
import type { Metadata } from "next";
import { formatOrganizationNumber } from "@/src/lib/organizationNumber";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org_nr: string }>;
}): Promise<Metadata> {
  const { org_nr } = await params;
  const identifier = decodeURIComponent(org_nr);
  const displayIdentifier = identifier.startsWith("id:")
    ? "Företag"
    : formatOrganizationNumber(identifier);
  return {
    title: displayIdentifier,
    description: `Företagsinformation och händelser för ${displayIdentifier}.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ org_nr: string }>;
}) {
  const { org_nr } = await params;

  const orgNr = decodeURIComponent(org_nr);
  const company = await getCompany(orgNr);
  if (!company) notFound();

  const [turnoverHistory, eventHistory] = await Promise.all([
    getCompanyTurnoverHistory(orgNr),
    getCompanyEventHistory(orgNr),
  ]);

  return (
    <Page>
      <CompanyHeaderCard company={company} />
      <CompanyInsightSections
        company={company}
        turnoverHistory={turnoverHistory.items}
        eventHistory={eventHistory.items}
      />
    </Page>
  );
}
