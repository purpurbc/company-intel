import { BackLink } from "@/src/components/ui/BackLink";
import { RegionIndexList } from "@/src/components/region/RegionIndexList";
import { COUNTY_OPTIONS } from "@/src/lib/companyFilterOptions";

export default function CountiesPage() {
  const items = COUNTY_OPTIONS.map((county) => ({
    code: county.value,
    name: county.label,
    href: `/county/${encodeURIComponent(county.value)}`,
    meta: "Län",
  }));

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>

        <RegionIndexList
          title="Alla län"
          eyebrow="Regional navigation"
          description="Bläddra bland län och öppna en regional marknadsöversikt."
          searchPlaceholder="Sök län eller länskod"
          items={items}
        />
      </div>
    </main>
  );
}
