"use client";

import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-md border border-app-border bg-app-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-app-text">{title}</span>
            {badge ? (
              <span className="rounded-md border border-app-border bg-app-panel-soft px-2 py-0.5 text-xs text-app-text-muted">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-app-text-muted">{subtitle}</p>
          ) : null}
        </div>

        <span
          className={[
            "text-xs text-app-text-muted transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {open ? <div className="border-t border-app-border px-4 py-4">{children}</div> : null}
    </div>
  );
}
