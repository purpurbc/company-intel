import { CompanySearch } from "@/src/components/company/CompanySearch";
import { Page } from "@/src/components/ui/Page";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Företag",
  "Sök och filtrera svenska företag.",
);

export default function CompaniesPage() {
  return (
    <Page>
      <CompanySearch />
    </Page>
  );
}
