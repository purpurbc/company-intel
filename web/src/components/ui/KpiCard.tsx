import type { ReactNode } from "react";
import type { MetricCoverage } from "@/src/lib/types";
import { Surface } from "@/src/components/ui/Surface";
import { ui } from "@/src/lib/uiStyles";

type KpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  coverage?: MetricCoverage;
  className?: string;
};

const kpiColumns = {
  four: "lg:grid-cols-4",
  five: "md:grid-cols-5",
  six: "lg:grid-cols-4 xl:grid-cols-6",
} as const;

/** Shared responsive layout for metric cards. */
export function KpiGrid({
  children,
  columns = "five",
}: {
  children: ReactNode;
  columns?: keyof typeof kpiColumns;
}) {
  return (
    <div className={["grid grid-cols-2 gap-4", kpiColumns[columns]].join(" ")}>
      {children}
    </div>
  );
}

export function KpiCard({ label, value, detail, coverage, className = "" }: KpiCardProps) {
  return (
    <Surface padding="compact" className={className}>
      <div className={ui.eyebrow}>{label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-app-text">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs text-app-text-subtle">{detail}</div>
      ) : null}
      {coverage ? (
        <div className="mt-1 text-[11px] text-app-text-subtle">
          Täckning: {coverage.percent === null ? "Saknas" : `${coverage.percent.toLocaleString("sv-SE")}%`}
        </div>
      ) : null}
    </Surface>
  );
}
