import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import type { CountByName } from "@/src/lib/types";

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
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Företagsmix
        </p>
        <h2 className="text-lg font-semibold text-slate-100">
          Regional företagsmix
        </h2>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
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
