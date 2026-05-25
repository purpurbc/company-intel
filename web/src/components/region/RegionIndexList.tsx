"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function Position({ value }: { value: number }) {
  return (
    <span className="shrink-0 tabular-nums text-slate-600">
      {value.toLocaleString("sv-SE")}
    </span>
  );
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
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {eyebrow}
        </p>
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {description}
            </p>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950/50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Visar
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-50">
              {visibleItems.length.toLocaleString("sv-SE")}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={ui.input}
            />

            <div className="flex shrink-0 rounded-md border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setCompact(false)}
                className={[
                  "rounded px-3 py-1.5 text-sm font-medium transition",
                  !compact
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                Kort
              </button>
              <button
                type="button"
                onClick={() => setCompact(true)}
                className={[
                  "rounded px-3 py-1.5 text-sm font-medium transition",
                  compact
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                Kompakt
              </button>
            </div>
          </div>
        </div>

        {visibleItems.length > 0 ? (
          <ul className="overflow-hidden">
            {visibleItems.map((item, index) =>
              compact ? (
                <li
                  key={item.code}
                  className="border-b border-slate-800 px-4 py-2.5 transition last:border-b-0 hover:bg-slate-800/40"
                >
                  <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 text-sm md:grid-cols-[2.5rem_minmax(0,1fr)_auto] md:items-center">
                    <Position value={index + 1} />
                    <Link
                      href={item.href}
                      className="min-w-0 truncate font-medium text-slate-50 hover:text-white"
                    >
                      {item.name}
                    </Link>
                    <div className="col-start-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-slate-400 md:col-start-auto md:justify-end">
                      <span>{item.code}</span>
                      {item.meta ? <span className="truncate">{item.meta}</span> : null}
                    </div>
                  </div>
                </li>
              ) : (
                <li
                  key={item.code}
                  className="border-b border-slate-800 p-4 transition last:border-b-0 hover:bg-slate-800/40"
                >
                  <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[2.5rem_minmax(0,1fr)_auto] md:items-start">
                    <div className="pt-1 text-xs">
                      <Position value={index + 1} />
                    </div>

                    <div className="min-w-0 space-y-2">
                      <Link
                        href={item.href}
                        className="block truncate font-medium text-slate-50 hover:text-white"
                      >
                        {item.name}
                      </Link>
                      <div className="text-sm text-slate-400">
                        Kod {item.code}
                        {item.meta ? ` | ${item.meta}` : ""}
                      </div>
                    </div>

                    <Link
                      href={item.href}
                      className="col-start-2 rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-800 md:col-start-auto"
                    >
                      Öppna
                    </Link>
                  </div>
                </li>
              ),
            )}
          </ul>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            Inga träffar matchar sökningen.
          </div>
        )}
      </section>
    </div>
  );
}
