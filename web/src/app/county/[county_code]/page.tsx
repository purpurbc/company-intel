import { Suspense } from "react";

import { getCountyOverview } from "@/src/lib/api";
import { COUNTY_OPTIONS } from "@/src/lib/companyFilterOptions";
import type {
  CountyOverview,
  CountyOverviewNotFound,
  CountyOverviewResponse,
} from "@/src/lib/types";

import { BackLink } from "@/src/components/ui/BackLink";
import { RegionDataSkeleton } from "@/src/components/ui/Skeleton";
import { CountyHeader } from "@/src/components/county/CountyHeader";
import { CountyKpis } from "@/src/components/county/CountyKpis";
import { CountyGeography } from "@/src/components/county/CountyGeography";
import { CountyInsightSections } from "@/src/components/county/CountyInsightSections";
import { CountyBusinessMix } from "@/src/components/county/CountyBusinessMix";

function isCountyNotFound(
  data: CountyOverviewResponse,
): data is CountyOverviewNotFound {
  return "error" in data && data.error === "not_found";
}

function getCountyName(countyCode: string) {
  return (
    COUNTY_OPTIONS.find((county) => county.value === countyCode)?.label ??
    countyCode
  );
}

async function CountyData({ countyCode }: { countyCode: string }) {
  const data = await getCountyOverview(countyCode);

  if (isCountyNotFound(data)) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-2xl font-semibold">Län hittades inte</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ingen länsöversikt kunde hämtas för koden {countyCode}.
        </p>
      </div>
    );
  }

  const county: CountyOverview = data;

  return (
    <>
      <CountyKpis totals={county.totals} />
      <CountyInsightSections county={county} />
      <CountyGeography
        byMunicipality={county.by_municipality}
        byAregion={county.by_aregion}
      />
      <CountyBusinessMix
        byIndustry={county.by_industry}
        bySize={county.by_size}
        byTurnover={county.by_turnover}
      />
    </>
  );
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ county_code: string }>;
}) {
  const { county_code } = await params;
  const countyName = getCountyName(county_code);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <CountyHeader countyName={countyName} />
        <Suspense fallback={<RegionDataSkeleton />}>
          <CountyData countyCode={county_code} />
        </Suspense>
      </div>
    </main>
  );
}
