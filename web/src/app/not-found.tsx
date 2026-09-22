import Link from "next/link";

import { buttonClassName } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Page } from "@/src/components/ui/Page";

export default function NotFoundPage() {
  return (
    <Page width="narrow">
      <EmptyState
        title="Sidan finns inte"
        description="Kontrollera adressen eller gå tillbaka till startsidan."
        action={
          <Link href="/" className={buttonClassName({ size: "sm" })}>
            Till startsidan
          </Link>
        }
      />
    </Page>
  );
}
