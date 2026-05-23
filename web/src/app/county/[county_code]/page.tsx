import { getCountyOverview } from "@/src/lib/api";
import type {
  CountyOverview,
  CountyOverviewNotFound,
  CountyOverviewResponse,
} from "@/src/lib/types";

import { BackLink } from "@/src/components/ui/BackLink";
import { CountyHeader } from "@/src/components/county/CountyHeader";
import { CountyKpis } from "@/src/components/county/CountyKpis";
import { CountyGeography } from "@/src/components/county/CountyGeography";
import { CountyInsightSections } from "@/src/components/county/CountyInsightSections";

function isCountyNotFound(
  data: CountyOverviewResponse,
): data is CountyOverviewNotFound {
  return "error" in data && data.error === "not_found";
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ county_code: string }>;
}) {
  const { county_code } = await params;
  const data = await getCountyOverview(county_code);

  if (isCountyNotFound(data)) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <BackLink href="/">Tillbaka</BackLink>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h1 className="text-2xl font-semibold">Län hittades inte</h1>
            <p className="mt-2 text-sm text-slate-400">
              Ingen länsöversikt kunde hämtas för koden {county_code}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const county: CountyOverview = data;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <CountyHeader countyName={county.county_name} />
        <CountyKpis totals={county.totals} />
        <CountyInsightSections county={county} />
        <CountyGeography
          byMunicipality={county.by_municipality}
          byAregion={county.by_aregion}
        />
      </div>
    </main>
  );
}
