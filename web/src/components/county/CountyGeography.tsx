import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { SectionHeading } from "@/src/components/ui/PageHeader";
import { ui } from "@/src/lib/uiStyles";

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
      <SectionHeading eyebrow="Geografi" title="Regional fördelning" />

      <div className={ui.sectionGrid}>
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
