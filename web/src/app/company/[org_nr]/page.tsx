import { getCompany } from "@/src/lib/api";
import type { Company, CompanyNotFound, CompanyResponse } from "@/src/lib/types";

import { BackLink } from "@/src/components/ui/BackLink";
import { CompanyHeaderCard } from "@/src/components/company/CompanyHeaderCard";
import { CompanyOverviewCard } from "@/src/components/company/CompanyOverviewCard";
import { RawPayload } from "@/src/components/company/RawPayload";

function isCompanyNotFound(company: CompanyResponse): company is CompanyNotFound {
  return "error" in company && company.error === "not_found";
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ org_nr: string }>;
}) {
  const { org_nr } = await params;

  const orgNr = decodeURIComponent(org_nr);
  const data = await getCompany(orgNr);

  if (isCompanyNotFound(data)) {
    return (
      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <BackLink href="/">← Tillbaka</BackLink>
        <div className="border rounded p-4">
          <h1 className="text-2xl font-semibold">Bolag hittades inte</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ingen företagsinformation kunde hämtas för organisationsnumret.
          </p>
        </div>
      </main>
    );
  }

  const company: Company = data;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <BackLink href="/">← Tillbaka</BackLink>

      <CompanyHeaderCard company={company} />
      <CompanyOverviewCard company={company} />
      <RawPayload data={company} />
    </main>
  );
}