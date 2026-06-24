import { BackLink } from "@/src/components/ui/BackLink";
import { RegionIndexList } from "@/src/components/region/RegionIndexList";
import {
  COUNTY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
} from "@/src/lib/companyFilterOptions";

export default function MunicipalitiesPage() {
  const countyByCode = new Map(
    COUNTY_OPTIONS.map((county) => [county.value, county.label]),
  );

  const items = MUNICIPALITY_OPTIONS.map((municipality) => {
    const countyCode = MUNICIPALITY_TO_COUNTY[municipality.value];
    const countyName = countyByCode.get(countyCode) ?? "Län saknas";

    return {
      code: municipality.value,
      name: municipality.label,
      href: `/municipality/${encodeURIComponent(municipality.value)}`,
      meta: countyName,
    };
  });

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <RegionIndexList
          title="Alla kommuner"
          eyebrow="Kommunal navigation"
          description="Bläddra bland kommuner och öppna en lokal marknadsöversikt."
          searchPlaceholder="Sök kommun, kommunkod eller län"
          items={items}
        />
      </div>
    </main>
  );
}
