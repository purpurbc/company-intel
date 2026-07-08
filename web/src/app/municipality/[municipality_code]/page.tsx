import { Suspense } from "react";

import { getMunicipalityOverview } from "@/src/lib/api";
import {
  COUNTY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
} from "@/src/lib/companyFilterOptions";
import type {
  MunicipalityOverview,
  MunicipalityOverviewNotFound,
  MunicipalityOverviewResponse,
} from "@/src/lib/types";

import { RegionDataSkeleton } from "@/src/components/ui/Skeleton";
import { MunicipalityHeader } from "@/src/components/municipality/MunicipalityHeader";
import { MunicipalityInsightSections } from "@/src/components/municipality/MunicipalityInsightSections";

function isMunicipalityNotFound(
  data: MunicipalityOverviewResponse,
): data is MunicipalityOverviewNotFound {
  return "error" in data && data.error === "not_found";
}

function getMunicipalityName(municipalityCode: string) {
  return (
    MUNICIPALITY_OPTIONS.find(
      (municipality) => municipality.value === municipalityCode,
    )?.label ?? municipalityCode
  );
}

function getCountyName(countyCode: string) {
  return (
    COUNTY_OPTIONS.find((county) => county.value === countyCode)?.label ??
    "Län saknas"
  );
}

async function MunicipalityData({
  municipalityCode,
}: {
  municipalityCode: string;
}) {
  const data = await getMunicipalityOverview(municipalityCode);

  if (isMunicipalityNotFound(data)) {
    return (
      <div className="rounded-sm border border-app-border bg-app-panel p-4">
        <h2 className="text-base font-semibold text-app-text">
          Kommun hittades inte
        </h2>
        <p className="mt-2 text-sm text-app-text-muted">
          Ingen kommunöversikt kunde hämtas för koden {municipalityCode}.
        </p>
      </div>
    );
  }

  const municipality: MunicipalityOverview = data;

  return <MunicipalityInsightSections municipality={municipality} />;
}

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipality_code: string }>;
}) {
  const { municipality_code } = await params;
  const countyCode = MUNICIPALITY_TO_COUNTY[municipality_code] ?? "";
  const municipalityName = getMunicipalityName(municipality_code);
  const countyName = getCountyName(countyCode);

  return (
    <main className="min-h-screen bg-app-bg px-5 py-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <MunicipalityHeader
          municipalityName={municipalityName}
          municipalityCode={municipality_code}
          countyName={countyName}
          countyCode={countyCode}
        />
        <Suspense fallback={<RegionDataSkeleton />}>
          <MunicipalityData municipalityCode={municipality_code} />
        </Suspense>
      </div>
    </main>
  );
}
