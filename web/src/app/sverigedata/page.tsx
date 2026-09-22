import Link from "next/link";

import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Surface } from "@/src/components/ui/Surface";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const metadata = pageMetadata(
  "Sverigedata",
  "Övergripande företags- och geografidata för Sverige.",
);

const pages = [
  {
    title: "Överblick",
    description: "Nationell företagsdata",
    href: "/sweden",
    icon: "/icons/menu/globe-svgrepo-com.svg",
  },
  {
    title: "Statistik",
    description: "Företag, företrädare och rapportering",
    href: "/sverigedata/statistik",
    icon: "/icons/menu/landmark-svgrepo-com.svg",
  },
  {
    title: "Geografi",
    description: "Län och kommuner",
    href: "/geography",
    icon: "/icons/menu/map-location-pin-svgrepo-com.svg",
  },
  {
    title: "Karta",
    description: "Geografisk företagsvy",
    href: "/map",
    icon: "/icons/menu/map-svgrepo-com.svg",
  },
] as const;

export default function SwedenDataIndexPage() {
  return (
    <Page width="narrow">
      <PageHeader title="Sverigedata" />
      <Surface padding="none" className="overflow-hidden">
        <nav className="divide-y divide-app-border" aria-label="Sverigedata">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="flex min-w-0 items-center gap-3 px-3 py-2.5 transition hover:bg-app-panel-hover-soft"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-app-text-muted">
                <MaskedIcon src={page.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-app-text">
                  {page.title}
                </span>
                <span className="block text-xs text-app-text-subtle">
                  {page.description}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </Surface>
    </Page>
  );
}
