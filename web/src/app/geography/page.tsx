import { GeographyIndexList } from "@/src/components/geography/GeographyIndexList";
import { Page } from "@/src/components/ui/Page";
import {
  COUNTY_OPTIONS,
  MUNICIPALITY_OPTIONS,
  MUNICIPALITY_TO_COUNTY,
} from "@/src/lib/companyFilterOptions";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Geografi",
  "Svenska län och kommuner i en gemensam struktur.",
);

export default function GeographyPage() {
  const municipalitiesByCounty = new Map<
    string,
    Array<{ code: string; name: string; href: string }>
  >();

  for (const municipality of MUNICIPALITY_OPTIONS) {
    const countyCode = MUNICIPALITY_TO_COUNTY[municipality.value];
    if (!countyCode) continue;

    const items = municipalitiesByCounty.get(countyCode) ?? [];
    items.push({
      code: municipality.value,
      name: municipality.label,
      href: `/municipality/${encodeURIComponent(municipality.value)}`,
    });
    municipalitiesByCounty.set(countyCode, items);
  }

  const counties = COUNTY_OPTIONS.map((county) => ({
    code: county.value,
    name: county.label,
    href: `/county/${encodeURIComponent(county.value)}`,
    municipalities: (municipalitiesByCounty.get(county.value) ?? []).sort(
      (left, right) => left.name.localeCompare(right.name, "sv-SE"),
    ),
  }));

  return (
    <Page>
      <GeographyIndexList counties={counties} />
    </Page>
  );
}
