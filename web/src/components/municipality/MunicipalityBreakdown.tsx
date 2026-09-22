import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { SectionHeading } from "@/src/components/ui/PageHeader";
import type { CountByName } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

type MunicipalityBreakdownProps = {
  byIndustry: CountByName[];
  bySize: CountByName[];
  byTurnover: CountByName[];
};

export function MunicipalityBreakdown({
  byIndustry,
  bySize,
  byTurnover,
}: MunicipalityBreakdownProps) {
  return (
    <section className="space-y-4">
      <SectionHeading eyebrow="Fördelning" title="Kommunal företagsmix" />

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
