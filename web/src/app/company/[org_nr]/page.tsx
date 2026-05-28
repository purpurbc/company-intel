import { getCompany, getCompanyTurnoverHistory } from "@/src/lib/api";
import type { Company, CompanyNotFound, CompanyResponse } from "@/src/lib/types";

import { BackLink } from "@/src/components/ui/BackLink";
import { CompanyHeaderCard } from "@/src/components/company/CompanyHeaderCard";
import { CompanyInsightSections } from "@/src/components/company/CompanyInsightSections";
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
  const [data, turnoverHistory] = await Promise.all([
    getCompany(orgNr),
    getCompanyTurnoverHistory(orgNr),
  ]);

  if (isCompanyNotFound(data)) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <div className="mx-auto max-w-7xl space-y-4">
          <BackLink href="/">Tillbaka</BackLink>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h1 className="text-2xl font-semibold">Bolag hittades inte</h1>
            <p className="mt-2 text-sm text-slate-400">
              Ingen företagsinformation kunde hämtas för organisationsnumret.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const company: Company = data;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <CompanyHeaderCard company={company} />
        <CompanyInsightSections
          company={company}
          turnoverHistory={turnoverHistory.items}
        />
        <RawPayload data={company} />
      </div>
    </main>
  );
}
