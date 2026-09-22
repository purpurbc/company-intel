"use client";

import { Button } from "@/src/components/ui/Button";
import { Feedback } from "@/src/components/ui/Feedback";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Page width="narrow">
      <PageHeader title="Något gick fel" />
      <Feedback tone="danger">
        Sidan kunde inte laddas. Försök igen.
      </Feedback>
      <div>
        <Button type="button" onClick={reset}>
          Försök igen
        </Button>
      </div>
    </Page>
  );
}
