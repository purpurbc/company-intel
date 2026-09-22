import type { ReactNode } from "react";

type SummaryGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

const columnClass = {
  2: "sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

/** Borderless, low-emphasis facts shown at the bottom of result cards. */
export function SummaryGrid({
  children,
  columns = 3,
  className = "",
}: SummaryGridProps) {
  return (
    <div
      className={[
        "grid min-w-0 gap-x-3 gap-y-1.5 rounded-md bg-app-summary-bg px-2 py-1.5",
        columnClass[columns],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SummaryItem({
  label,
  children,
  className = "",
  valueClassName = "",
}: {
  label: ReactNode;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={["min-w-0", className].join(" ")}>
      <div className="text-[10px] font-medium uppercase leading-4 text-app-text-subtle">
        {label}
      </div>
      <div
        className={[
          "mt-0.5 min-w-0 break-words text-xs font-medium leading-4 text-app-text",
          valueClassName,
        ].join(" ")}
      >
        {children ?? "-"}
      </div>
    </div>
  );
}
