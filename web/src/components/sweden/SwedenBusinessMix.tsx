import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import type { CountByName } from "@/src/lib/types";

type SwedenBusinessMixProps = {
  byCounty: CountByName[];
  byMunicipality: CountByName[];
  byIndustry: CountByName[];
  bySection: CountByName[];
  bySize: CountByName[];
  byTurnover: CountByName[];
  byStatus: CountByName[];
  byState: CountByName[];
  byEmployerStatus: CountByName[];
  byVatStatus: CountByName[];
  byFTaxStatus: CountByName[];
  byMarketing: CountByName[];
};

export function SwedenBusinessMix({
  byCounty,
  byMunicipality,
  byIndustry,
  bySection,
  bySize,
  byTurnover,
  byStatus,
  byState,
  byEmployerStatus,
  byVatStatus,
  byFTaxStatus,
  byMarketing,
}: SwedenBusinessMixProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Företagsmix
        </p>
        <h2 className="text-lg font-semibold text-slate-100">
          Sverige som marknad
        </h2>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <HorizontalBarList
          title="Företag per län"
          items={byCounty}
          maxItems={30}
          hrefPrefix="/county"
        />

        <HorizontalBarList
          title="Största kommuner"
          items={byMunicipality}
          maxItems={25}
          hrefPrefix="/municipality"
        />

        <HorizontalBarList
          title="Företag per branschgrupp"
          items={byIndustry}
          maxItems={100}
        />

        <HorizontalBarList
          title="Företag per avdelning"
          items={bySection}
          maxItems={30}
        />

        <HorizontalBarList
          title="Företag per omsättningsklass"
          items={byTurnover}
          maxItems={25}
        />

        <HorizontalBarList
          title="Företag per storleksklass"
          items={bySize}
          maxItems={25}
        />

        <HorizontalBarList
          title="Företag per status"
          items={byStatus}
          maxItems={10}
        />

        <HorizontalBarList
          title="Företag per riskläge"
          items={byState}
          maxItems={10}
        />

        <HorizontalBarList
          title="Företag per arbetsgivarstatus"
          items={byEmployerStatus}
          maxItems={10}
        />

        <HorizontalBarList
          title="Företag per momsstatus"
          items={byVatStatus}
          maxItems={10}
        />

        <HorizontalBarList
          title="Företag per F-skattstatus"
          items={byFTaxStatus}
          maxItems={10}
        />

        <HorizontalBarList
          title="Företag per reklamstatus"
          items={byMarketing}
          maxItems={10}
        />
      </div>
    </section>
  );
}
