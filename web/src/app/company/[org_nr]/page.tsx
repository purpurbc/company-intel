import { getCompany, getCompanyTurnoverHistory } from "@/src/lib/api";
import type { Company, CompanyNotFound, CompanyResponse } from "@/src/lib/types";

import { CompanyHeaderCard } from "@/src/components/company/CompanyHeaderCard";
import { CompanyInsightSections } from "@/src/components/company/CompanyInsightSections";

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
  const [data, turnoverHistory] = await Promise.all([
    getCompany(orgNr),
    getCompanyTurnoverHistory(orgNr),
  ]);

  if (isCompanyNotFound(data)) {
    return (
      <main className="min-h-screen bg-app-bg p-6 text-app-text">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="border-b border-app-border pb-5">
            <h1 className="text-2xl font-semibold">Bolag hittades inte</h1>
            <p className="mt-2 text-sm text-app-text-muted">
              Ingen företagsinformation kunde hämtas för organisationsnumret.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const company: Company = data;

  return (
    <main className="min-h-screen bg-app-bg px-5 py-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <CompanyHeaderCard company={company} />
        <CompanyInsightSections
          company={company}
          turnoverHistory={turnoverHistory.items}
        />
      </div>
    </main>
  );
}
