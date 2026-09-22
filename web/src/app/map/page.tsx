import { SwedenBoundaryMap } from "@/src/components/map/SwedenBoundaryMap";
import { Page } from "@/src/components/ui/Page";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Karta",
  "Utforska svenska län och kommuner på karta.",
);

export default function MapPage() {
  return (
    <Page
      className="!min-h-0 !p-0"
      contentClassName="!max-w-none !space-y-0"
    >
      <SwedenBoundaryMap />
    </Page>
  );
}
