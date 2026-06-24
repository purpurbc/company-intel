import { Suspense } from "react";

import { getSwedenOverview } from "@/src/lib/api";
import { BackLink } from "@/src/components/ui/BackLink";
import { SwedenDataSkeleton } from "@/src/components/ui/Skeleton";
import { SwedenHeader } from "@/src/components/sweden/SwedenHeader";
import { SwedenKpis } from "@/src/components/sweden/SwedenKpis";
import { SwedenBusinessMix } from "@/src/components/sweden/SwedenBusinessMix";

export const dynamic = "force-dynamic";

async function SwedenData() {
  const overview = await getSwedenOverview();

  return (
    <>
      <SwedenKpis totals={overview.totals} />
      <SwedenBusinessMix
        byCounty={overview.by_county}
        byMunicipality={overview.by_municipality}
        byIndustry={overview.by_industry}
        bySection={overview.by_section}
        bySize={overview.by_size}
        byTurnover={overview.by_turnover}
        byStatus={overview.by_status}
        byState={overview.by_state}
        byEmployerStatus={overview.by_employer_status}
        byVatStatus={overview.by_vat_status}
        byFTaxStatus={overview.by_f_tax_status}
        byMarketing={overview.by_marketing}
      />
    </>
  );
}

export default function SwedenPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <SwedenHeader />
        <Suspense fallback={<SwedenDataSkeleton />}>
          <SwedenData />
        </Suspense>
      </div>
    </main>
  );
}
