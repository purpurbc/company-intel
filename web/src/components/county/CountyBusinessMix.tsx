import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { SectionHeading } from "@/src/components/ui/PageHeader";
import type { CountByName } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

type CountyBusinessMixProps = {
  byIndustry: CountByName[];
  bySize: CountByName[];
  byTurnover: CountByName[];
};

export function CountyBusinessMix({
  byIndustry,
  bySize,
  byTurnover,
}: CountyBusinessMixProps) {
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Företagsmix" title="Regional företagsmix" />

      <div className={ui.sectionGrid}>
        <HorizontalBarList
          title="Företag per branschgrupp"
          items={byIndustry}
          maxItems={100}
        />

        <HorizontalBarList
          title="Företag per storleksklass"
          items={bySize}
          maxItems={25}
        />

        <HorizontalBarList
          title="Företag per omsättningsklass"
          items={byTurnover}
          maxItems={25}
        />
      </div>
    </section>
  );
}
