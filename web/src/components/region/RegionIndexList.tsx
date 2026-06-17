"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClassName } from "@/src/components/ui/Button";
import { List, ListItem } from "@/src/components/ui/List";
import { ToggleButton } from "@/src/components/ui/ToggleButton";
import { ui } from "@/src/lib/uiStyles";

type RegionItem = {
  code: string;
  name: string;
  href: string;
  meta?: string;
};

type RegionIndexListProps = {
  title: string;
  eyebrow: string;
  description: string;
  searchPlaceholder: string;
  items: RegionItem[];
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export function RegionIndexList({
  title,
  eyebrow,
  description,
  searchPlaceholder,
  items,
}: RegionIndexListProps) {
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(true);

  const visibleItems = useMemo(() => {
    const q = normalize(query);
    if (!q) return items;

    return items.filter((item) =>
      normalize(`${item.code} ${item.name} ${item.meta ?? ""}`).includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-app-border bg-app-panel p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
          {eyebrow}
        </p>
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-app-text">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-app-text-muted">
              {description}
            </p>
          </div>

          <div className="rounded-md border border-app-border bg-app-panel-soft px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
              Visar
            </div>
            <div className="mt-1 text-xl font-semibold text-app-text">
              {visibleItems.length.toLocaleString("sv-SE")}
            </div>
          </div>
        </div>
      </section>

      <List
        header={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={ui.input}
            />

            <ToggleButton
              value={compact ? "compact" : "card"}
              options={[
                { value: "card", label: "Kort" },
                { value: "compact", label: "Kompakt" },
              ]}
              onChange={(value) => setCompact(value === "compact")}
              ariaLabel="Visningsläge"
              className="shrink-0"
            />
          </div>
        }
        empty={
          visibleItems.length === 0 ? "Inga träffar matchar sökningen." : null
        }
      >
        {visibleItems.map((item, index) =>
          compact ? (
            <ListItem key={item.code} compact numbered index={index + 1}>
              <div className="grid min-w-0 gap-1 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-3">
                <Link
                  href={item.href}
                  className="min-w-0 truncate font-medium text-app-text hover:text-app-text"
                >
                  {item.name}
                </Link>
                <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-app-text-muted md:justify-end">
                  <span>{item.code}</span>
                  {item.meta ? <span className="truncate">{item.meta}</span> : null}
                </div>
              </div>
            </ListItem>
          ) : (
            <ListItem key={item.code} numbered index={index + 1}>
              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="min-w-0 space-y-2">
                  <Link
                    href={item.href}
                    className="block truncate font-medium text-app-text hover:text-app-text"
                  >
                    {item.name}
                  </Link>
                  <div className="text-sm text-app-text-muted">
                    Kod {item.code}
                    {item.meta ? ` | ${item.meta}` : ""}
                  </div>
                </div>

                <Link
                  href={item.href}
                  className={buttonClassName({
                    variant: "secondary",
                    size: "sm",
                    className: "md:col-start-auto",
                  })}
                >
                  Öppna
                </Link>
              </div>
            </ListItem>
          ),
        )}
      </List>
    </div>
  );
}
