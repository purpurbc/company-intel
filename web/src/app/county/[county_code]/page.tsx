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

function isCountyNotFound(
  data: CountyOverviewResponse
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
      <main className="p-6 max-w-6xl mx-auto space-y-4">
        <BackLink href="/">← Tillbaka</BackLink>

        <div className="border rounded p-4">
          <h1 className="text-2xl font-semibold">Län hittades inte</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ingen länsöversikt kunde hämtas för koden {county_code}.
          </p>
        </div>
      </main>
    );
  }

  const county: CountyOverview = data;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-8">
      <BackLink href="/">← Tillbaka</BackLink>

      <CountyHeader countyName={county.county_name} />
      <CountyKpis totals={county.totals} />
      <CountyGeography
        byMunicipality={county.by_municipality}
        byAregion={county.by_aregion}
      />
    </main>
  );
}