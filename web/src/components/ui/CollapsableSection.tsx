"use client";

import { useState, type ReactNode } from "react";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { Surface } from "@/src/components/ui/Surface";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { InfoChip } from "@/src/components/ui/Chip";

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
    <Surface padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-app-text">{title}</span>
            {badge ? (
              <InfoChip>{badge}</InfoChip>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-app-text-muted">{subtitle}</p>
          ) : null}
        </div>

        <span className="text-app-text-muted">
          <ChevronIcon expanded={open} />
        </span>
      </button>

      <AnimatedCollapse expanded={open}>
        <div className="border-t border-app-border p-4">{children}</div>
      </AnimatedCollapse>
    </Surface>
  );
}
