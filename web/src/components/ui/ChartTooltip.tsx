"use client";

import { useId, useState, type ReactNode, type SyntheticEvent } from "react";

/** One tooltip for SVG marks, available by pointer, touch or keyboard focus. */
export function ChartTooltip({ children }: { children: ReactNode }) {
  const id = useId();
  const [tooltip, setTooltip] = useState<{
    text: string; color: string; left: number; top: number;
  } | null>(null);

  function handleMark(event: SyntheticEvent<HTMLDivElement>) {
    const mark = (event.target as Element).closest<SVGElement>("[data-chart-info]");
    if (!mark) {
      setTooltip(null);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = mark.getBoundingClientRect();
    const center = point.left + point.width / 2 - bounds.left;
    // Bars anchor below their value end; circles anchor below the point.
    const pointY = mark.tagName === "rect" ? point.top : point.bottom;
    setTooltip({
      text: mark.dataset.chartInfo ?? "",
      color: mark.dataset.chartColor ?? "currentColor",
      left: Math.max(0, Math.min(center - 100, bounds.width - Math.min(200, bounds.width))),
      top: pointY - bounds.top + 8,
    });
  }

  return (
    <div
      className="relative"
      onPointerOver={handleMark}
      onPointerLeave={() => setTooltip(null)}
      onFocus={handleMark}
      onBlur={() => setTooltip(null)}
      onClick={handleMark}
      onKeyDown={(event) => { if (event.key === "Escape") setTooltip(null); }}
      aria-describedby={tooltip ? id : undefined}
    >
      {children}
      {tooltip ? (
        <div
          id={id}
          role="tooltip"
          className="pointer-events-none absolute z-20 flex w-[200px] max-w-full items-start gap-2 rounded-md border border-app-border bg-app-panel px-2 py-1.5 text-xs text-app-text shadow-[var(--app-shadow-float)]"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: tooltip.color }} />
          <span>{tooltip.text}</span>
        </div>
      ) : null}
    </div>
  );
}
