import {
  listSavedSegments,
} from "@/src/lib/api";
import { SavedSegmentsList } from "@/src/components/profile/SavedSegmentsList";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Arbetsyta",
  "Hantera sparade segment.",
);

export default async function WorkspacePage() {
  const segments = await listSavedSegments();

  return (
    <Page>
      <PageHeader title="Arbetsyta" />
      <SavedSegmentsList segments={segments.items} />
    </Page>
  );
}
