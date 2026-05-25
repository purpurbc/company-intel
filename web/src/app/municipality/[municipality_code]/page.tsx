import { getMunicipalityOverview } from "@/src/lib/api";
import type {
  MunicipalityOverview,
  MunicipalityOverviewNotFound,
  MunicipalityOverviewResponse,
} from "@/src/lib/types";

import { BackLink } from "@/src/components/ui/BackLink";
import { MunicipalityHeader } from "@/src/components/municipality/MunicipalityHeader";
import { MunicipalityKpis } from "@/src/components/municipality/MunicipalityKpis";
import { MunicipalityInsightSections } from "@/src/components/municipality/MunicipalityInsightSections";
import { MunicipalityBreakdown } from "@/src/components/municipality/MunicipalityBreakdown";

function isMunicipalityNotFound(
  data: MunicipalityOverviewResponse,
): data is MunicipalityOverviewNotFound {
  return "error" in data && data.error === "not_found";
}

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipality_code: string }>;
}) {
  const { municipality_code } = await params;
  const data = await getMunicipalityOverview(municipality_code);

  if (isMunicipalityNotFound(data)) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <BackLink href="/">Tillbaka</BackLink>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h1 className="text-2xl font-semibold">Kommun hittades inte</h1>
            <p className="mt-2 text-sm text-slate-400">
              Ingen kommunöversikt kunde hämtas för koden {municipality_code}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const municipality: MunicipalityOverview = data;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <MunicipalityHeader
          municipalityName={municipality.municipality_name}
          countyName={municipality.county_name}
          countyCode={municipality.county_code}
        />
        <MunicipalityKpis totals={municipality.totals} />
        <MunicipalityInsightSections municipality={municipality} />
        <MunicipalityBreakdown
          byIndustry={municipality.by_industry}
          bySize={municipality.by_size}
          byTurnover={municipality.by_turnover}
        />
      </div>
    </main>
  );
}
