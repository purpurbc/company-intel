"use client";

import { useMemo, useState } from "react";

import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { Button } from "@/src/components/ui/Button";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Surface } from "@/src/components/ui/Surface";
import { TextLink } from "@/src/components/ui/TextLink";
import { ui } from "@/src/lib/uiStyles";

type MunicipalityItem = {
  code: string;
  name: string;
  href: string;
};

export type CountyWithMunicipalities = {
  code: string;
  name: string;
  href: string;
  municipalities: MunicipalityItem[];
};

type VisibleCounty = CountyWithMunicipalities & {
  municipalities: MunicipalityItem[];
  searchExpanded: boolean;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("sv-SE");
}

export function GeographyIndexList({
  counties,
}: {
  counties: CountyWithMunicipalities[];
}) {
  const [query, setQuery] = useState("");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleCounties = useMemo<VisibleCounty[]>(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return counties.map((county) => ({
        ...county,
        searchExpanded: false,
      }));
    }

    return counties.flatMap((county) => {
      const countyMatches = normalize(`${county.code} ${county.name}`).includes(
        normalizedQuery,
      );
      const matchingMunicipalities = county.municipalities.filter(
        (municipality) =>
          normalize(`${municipality.code} ${municipality.name}`).includes(
            normalizedQuery,
          ),
      );

      if (!countyMatches && matchingMunicipalities.length === 0) return [];

      return [
        {
          ...county,
          municipalities: countyMatches
            ? county.municipalities
            : matchingMunicipalities,
          searchExpanded: true,
        },
      ];
    });
  }, [counties, query]);

  function toggleCounty(code: string) {
    setExpandedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Geografi" />

      <Surface padding="none" className="overflow-hidden">
        <div className="border-b border-app-border p-4">
          <label className="sr-only" htmlFor="geography-search">
            Sök län eller kommun
          </label>
          <input
            id="geography-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök län, kommun eller kod"
            className={ui.input}
          />
        </div>

        {visibleCounties.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Inga träffar matchar sökningen." compact />
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {visibleCounties.map((county) => {
              const expanded =
                county.searchExpanded || expandedCodes.has(county.code);

              return (
                <article key={county.code}>
                  <div className="flex min-w-0 items-center gap-2 px-3 py-2.5 transition-colors hover:bg-app-panel-hover-soft sm:px-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 min-w-7 p-0"
                      onClick={() => toggleCounty(county.code)}
                      aria-expanded={expanded}
                      aria-controls={`county-${county.code}-municipalities`}
                      aria-label={`${expanded ? "Dölj" : "Visa"} kommuner i ${county.name}`}
                    >
                      <ChevronIcon expanded={expanded} />
                    </Button>

                    <div className="min-w-0 flex-1">
                      <TextLink
                        href={county.href}
                        className="inline-block max-w-full truncate align-bottom font-semibold"
                      >
                        {county.name}
                      </TextLink>
                    </div>

                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-app-text-subtle">
                      {county.code}
                    </span>
                  </div>

                  <AnimatedCollapse expanded={expanded}>
                    <div
                      id={`county-${county.code}-municipalities`}
                      className="border-t border-app-border bg-app-panel-soft"
                    >
                      {county.municipalities.map((municipality) => (
                        <div
                          key={municipality.code}
                          className="ml-8 flex min-w-0 items-center gap-3 border-l border-app-border px-4 py-2 text-sm transition-colors hover:bg-app-panel-hover-soft sm:ml-12"
                        >
                          <div className="min-w-0 flex-1">
                            <TextLink
                              href={municipality.href}
                              className="inline-block max-w-full truncate align-bottom"
                            >
                              {municipality.name}
                            </TextLink>
                          </div>
                          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-app-text-subtle">
                            {municipality.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AnimatedCollapse>
                </article>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
