import { AdminWorkspace } from "@/src/components/admin/AdminWorkspace";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { getAdminDataOverview } from "@/src/lib/api";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Admin",
  "Importer, datakvalitet och teknisk driftstatus.",
);

export default async function AdminPage() {
  const data = await getAdminDataOverview();
  return (
    <Page>
      <PageHeader
        title="Admin"
        meta={`Uppdaterad ${new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Stockholm" }).format(new Date(data.generated_at))}`}
      />
      <AdminWorkspace data={data} />
    </Page>
  );
}
