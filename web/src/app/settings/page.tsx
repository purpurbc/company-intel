import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { AppearanceSettings } from "@/src/components/settings/AppearanceSettings";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Inställningar",
  "Anpassa Cintelas inställningar.",
);

export default function SettingsPage() {
  return (
    <Page>
      <PageHeader title="Inställningar" />
      <AppearanceSettings />
    </Page>
  );
}
