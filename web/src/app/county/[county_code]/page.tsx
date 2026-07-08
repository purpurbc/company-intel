import { Suspense } from "react";

import { getCountyOverview } from "@/src/lib/api";
import { COUNTY_OPTIONS } from "@/src/lib/companyFilterOptions";
import type {
  CountyOverview,
  CountyOverviewNotFound,
  CountyOverviewResponse,
} from "@/src/lib/types";

import { RegionDataSkeleton } from "@/src/components/ui/Skeleton";
import { CountyHeader } from "@/src/components/county/CountyHeader";
import { CountyInsightSections } from "@/src/components/county/CountyInsightSections";

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
      <div className="rounded-sm border border-app-border bg-app-panel p-4">
        <h2 className="text-base font-semibold text-app-text">
          Län hittades inte
        </h2>
        <p className="mt-2 text-sm text-app-text-muted">
          Ingen länsöversikt kunde hämtas för koden {countyCode}.
        </p>
      </div>
    );
  }

  const county: CountyOverview = data;

  return <CountyInsightSections county={county} />;
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ county_code: string }>;
}) {
  const { county_code } = await params;
  const countyName = getCountyName(county_code);

  return (
    <main className="min-h-screen bg-app-bg px-5 py-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <CountyHeader countyName={countyName} countyCode={county_code} />
        <Suspense fallback={<RegionDataSkeleton />}>
          <CountyData countyCode={county_code} />
        </Suspense>
      </div>
    </main>
  );
}
