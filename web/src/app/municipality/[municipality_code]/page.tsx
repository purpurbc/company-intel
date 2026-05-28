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

import { BackLink } from "@/src/components/ui/BackLink";
import { RegionDataSkeleton } from "@/src/components/ui/Skeleton";
import { MunicipalityHeader } from "@/src/components/municipality/MunicipalityHeader";
import { MunicipalityKpis } from "@/src/components/municipality/MunicipalityKpis";
import { MunicipalityInsightSections } from "@/src/components/municipality/MunicipalityInsightSections";
import { MunicipalityBreakdown } from "@/src/components/municipality/MunicipalityBreakdown";

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
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-2xl font-semibold">Kommun hittades inte</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ingen kommunöversikt kunde hämtas för koden {municipalityCode}.
        </p>
      </div>
    );
  }

  const municipality: MunicipalityOverview = data;

  return (
    <>
      <MunicipalityKpis totals={municipality.totals} />
      <MunicipalityInsightSections municipality={municipality} />
      <MunicipalityBreakdown
        byIndustry={municipality.by_industry}
        bySize={municipality.by_size}
        byTurnover={municipality.by_turnover}
      />
    </>
  );
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
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <MunicipalityHeader
          municipalityName={municipalityName}
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
