import { notFound } from "next/navigation";

import { getMunicipalityOverview } from "@/src/lib/api";
import {
  COUNTY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
} from "@/src/lib/companyFilterOptions";
import { MunicipalityHeader } from "@/src/components/municipality/MunicipalityHeader";
import { MunicipalityInsightSections } from "@/src/components/municipality/MunicipalityInsightSections";
import { Page } from "@/src/components/ui/Page";
import type { Metadata } from "next";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipality_code: string }>;
}): Promise<Metadata> {
  const { municipality_code } = await params;
  const name = getMunicipalityName(municipality_code);
  return {
    title: name,
    description: `Företagsöversikt för ${name} kommun.`,
  };
}

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ municipality_code: string }>;
}) {
  const { municipality_code } = await params;
  const municipality = await getMunicipalityOverview(municipality_code);
  if (!municipality) notFound();
  const countyCode = MUNICIPALITY_TO_COUNTY[municipality_code] ?? "";
  const municipalityName = getMunicipalityName(municipality_code);
  const countyName = getCountyName(countyCode);

  return (
    <Page>
      <MunicipalityHeader
        municipalityName={municipalityName}
        municipalityCode={municipality_code}
        countyName={countyName}
        countyCode={countyCode}
      />
      <MunicipalityInsightSections municipality={municipality} />
    </Page>
  );
}
