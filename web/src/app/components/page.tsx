import { ComponentLibrary } from "@/src/components/ui/ComponentLibrary";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Komponentbibliotek",
  "Visuell referens för Cintelas gemensamma gränssnittskomponenter.",
);

export default function ComponentsPage() {
  return (
    <Page>
      <PageHeader title="Komponentbibliotek" />
      <ComponentLibrary />
    </Page>
  );
}
