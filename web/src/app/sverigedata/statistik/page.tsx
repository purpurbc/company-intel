import { Suspense } from "react";

import { BolagsverketStatisticsView } from "@/src/components/sweden/BolagsverketStatisticsView";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { SwedenDataSkeleton } from "@/src/components/ui/Skeleton";
import { getBolagsverketStatistics } from "@/src/lib/api";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Bolagsverkets statistik",
  "Aggregerad statistik om svenska företag och föreningar.",
);

async function StatisticsData() {
  const data = await getBolagsverketStatistics();
  return <BolagsverketStatisticsView data={data} />;
}

export default function BolagsverketStatisticsPage() {
  return (
    <Page>
      <PageHeader title="Bolagsverkets statistik" />
      <Suspense fallback={<SwedenDataSkeleton />}>
        <StatisticsData />
      </Suspense>
    </Page>
  );
}
