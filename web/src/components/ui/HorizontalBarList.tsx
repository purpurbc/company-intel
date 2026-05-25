"use client";

import Link from "next/link";
import { useState } from "react";

type Item = {
  code: string;
  name: string;
  count: number;
};

type HorizontalBarListProps = {
  title: string;
  items: Item[];
  maxItems?: number;
  previewItems?: number;
  hrefPrefix?: string;
};

export function HorizontalBarList({
  title,
  items,
  maxItems = 10,
  previewItems = 6,
  hrefPrefix,
}: HorizontalBarListProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const hasMore = sorted.length > previewItems;
  const top = sorted.slice(0, expanded ? maxItems : previewItems);
  const total = sorted.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>

      <div
        className={[
          "mt-4 space-y-3 overflow-hidden transition-[max-height]",
          expanded ? "max-h-none" : "max-h-72",
        ].join(" ")}
      >
        {top.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          const href = hrefPrefix
            ? `${hrefPrefix}/${encodeURIComponent(item.code)}`
            : null;

          return (
            <div key={`${item.code}-${item.name}`} className="space-y-1">
              <div className="flex min-w-0 justify-between gap-4 text-sm">
                {href ? (
                  <Link
                    href={href}
                    className="min-w-0 truncate text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white"
                  >
                    {item.code} {item.name}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate text-slate-300">
                    {item.code} {item.name}
                  </span>
                )}
                <span className="shrink-0 text-slate-500">
                  {item.count.toLocaleString("sv-SE")} | {pct.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 rounded-sm bg-slate-800">
                <div
                  className="h-2 rounded-sm bg-emerald-400/80"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          {expanded
            ? "Visa färre"
            : `Visa alla ${Math.min(sorted.length, maxItems).toLocaleString("sv-SE")}`}
        </button>
      ) : null}
    </div>
  );
}
