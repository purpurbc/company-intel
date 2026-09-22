import { notFound } from "next/navigation";

import { getCountyOverview } from "@/src/lib/api";
import { COUNTY_OPTIONS } from "@/src/lib/companyFilterOptions";
import { CountyHeader } from "@/src/components/county/CountyHeader";
import { CountyInsightSections } from "@/src/components/county/CountyInsightSections";
import { Page } from "@/src/components/ui/Page";
import type { Metadata } from "next";

function getCountyName(countyCode: string) {
  return (
    COUNTY_OPTIONS.find((county) => county.value === countyCode)?.label ??
    countyCode
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ county_code: string }>;
}): Promise<Metadata> {
  const { county_code } = await params;
  const name = getCountyName(county_code);
  return {
    title: name,
    description: `Företagsöversikt för ${name} län.`,
  };
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ county_code: string }>;
}) {
  const { county_code } = await params;
  const county = await getCountyOverview(county_code);
  if (!county) notFound();
  const countyName = getCountyName(county_code);

  return (
    <Page>
      <CountyHeader countyName={countyName} countyCode={county_code} />
      <CountyInsightSections county={county} />
    </Page>
  );
}
