"use client";

import Link from "next/link";
import { useState } from "react";
import {
  textLinkGroupedUnderlineClassName,
  textLinkGroupClassName,
} from "@/src/components/ui/TextLink";
import { Button } from "@/src/components/ui/Button";
import { Feedback } from "@/src/components/ui/Feedback";
import { Section } from "@/src/components/ui/Surface";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";

type Item = {
  code: string | null;
  name: string | null;
  count: number;
};

type HorizontalBarListProps = {
  title: string;
  items: Item[];
  maxItems?: number;
  previewItems?: number;
  hrefPrefix?: string;
  missingLabel?: string;
  className?: string;
  source?: string;
};

export function HorizontalBarList({
  title,
  items,
  maxItems = 10,
  previewItems = 6,
  hrefPrefix,
  missingLabel = "Kategori saknas",
  className = "",
  source,
}: HorizontalBarListProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const hasMore = sorted.length > previewItems;
  const preview = sorted.slice(0, previewItems);
  const additional = sorted.slice(previewItems, maxItems);
  const total = sorted.reduce((sum, i) => sum + i.count, 0);

  function renderItem(item: Item) {
    const pct = total > 0 ? (item.count / total) * 100 : 0;
    const code = item.code?.trim() || null;
    const name = item.name?.trim() || missingLabel;
    const codeLabel = code && code !== "unknown" ? code : "Saknas";
    const href = hrefPrefix && code && code !== "unknown"
      ? `${hrefPrefix}/${encodeURIComponent(code)}`
      : null;
    const content = (
      <>
        <span className="shrink-0 font-bold text-app-text">{codeLabel}</span>
        <span className="min-w-0 truncate">{name}</span>
      </>
    );

    return (
      <div key={`${codeLabel}-${name}`} className="space-y-1">
        <div className="flex min-w-0 justify-between gap-4 text-sm">
          {href ? (
            <Link href={href} className={textLinkGroupClassName}>
              <span className="shrink-0 font-bold text-app-text transition group-hover:text-app-accent-text">
                {codeLabel}
              </span>
              <span className={textLinkGroupedUnderlineClassName}>{name}</span>
            </Link>
          ) : (
            <span className="inline-flex min-w-0 items-baseline gap-2 text-app-text">
              {content}
            </span>
          )}
          <span className="shrink-0 tabular-nums text-app-text-muted">
            {item.count.toLocaleString("sv-SE")} | {pct.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 rounded-sm bg-app-panel-muted">
          <div
            className="h-2 rounded-sm bg-app-accent-text"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <Section title={title} source={source} className={["min-w-0", className].join(" ")}>
      <div className="space-y-3">
        {preview.length === 0 ? (
          <Feedback>
            Ingen data finns i underlaget.
          </Feedback>
        ) : null}

        {preview.map(renderItem)}
      </div>

      <AnimatedCollapse expanded={expanded}>
        <div className="space-y-3 pt-3">{additional.map(renderItem)}</div>
      </AnimatedCollapse>

      {hasMore ? (
        <Button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4"
          variant="secondary"
          size="sm"
        >
          {expanded
            ? "Visa färre"
            : `Visa alla ${Math.min(sorted.length, maxItems).toLocaleString("sv-SE")}`}
          <ChevronIcon expanded={expanded} />
        </Button>
      ) : null}
    </Section>
  );
}
