import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";

type CountyGeographyProps = {
  byMunicipality: {
    code : string,
    name: string;
    count: number;
  }[];

  byAregion: {
    code: string,
    name: string;
    count: number;
  }[];
};

export function CountyGeography({
  byMunicipality,
  byAregion,
}: CountyGeographyProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Geografisk fördelning</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarList
          title="Företag per kommun"
          items={byMunicipality}
          maxItems={100}
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