import { DashboardPromptBar } from "./DashboardPromptBar";
import { Page } from "@/src/components/ui/Page";
import { ui } from "@/src/lib/uiStyles";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Hem",
  "Sök svenska företag med namn eller organisationsnummer.",
);

export default function HomePage() {
  return (
    <Page
      width="narrow"
      contentClassName="flex min-h-[calc(100vh-7rem)] flex-col items-center pt-[28vh]"
    >
      <section className="w-full text-center">
        <h1 className={ui.pageTitle}>
          Cintela – hitta rätt företag
        </h1>
        <DashboardPromptBar />
      </section>
    </Page>
  );
}
