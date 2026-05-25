import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";

type CountyGeographyProps = {
  byMunicipality: {
    code: string;
    name: string;
    count: number;
  }[];

  byAregion: {
    code: string;
    name: string;
    count: number;
  }[];
};

export function CountyGeography({
  byMunicipality,
  byAregion,
}: CountyGeographyProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Geografi
        </p>
        <h2 className="text-lg font-semibold text-slate-100">
          Regional fördelning
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <HorizontalBarList
          title="Företag per kommun"
          items={byMunicipality}
          maxItems={100}
          hrefPrefix="/municipality"
        />

        <HorizontalBarList
          title="Företag per A-region"
          items={byAregion}
          maxItems={100}
        />
      </div>
    </section>
  );
}
