import { Suspense } from "react";

import { getSwedenOverview } from "@/src/lib/api";
import { SwedenDataSkeleton } from "@/src/components/ui/Skeleton";
import { Page } from "@/src/components/ui/Page";
import { SwedenHeader } from "@/src/components/sweden/SwedenHeader";
import { SwedenInsightSections } from "@/src/components/sweden/SwedenInsightSections";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Överblick",
  "Nationell överblick över Sveriges företagsbas.",
);

async function SwedenData() {
  const overview = await getSwedenOverview();

  return <SwedenInsightSections overview={overview} />;
}

export default function SwedenPage() {
  return (
    <Page>
      <SwedenHeader />
      <Suspense fallback={<SwedenDataSkeleton />}>
        <SwedenData />
      </Suspense>
    </Page>
  );
}
