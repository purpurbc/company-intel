import type { ReactNode } from "react";

import { ui } from "@/src/lib/uiStyles";

type DetailGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
} as const;

/** Compact, responsive metadata grid shared by expanded list cards. */
export function DetailGrid({
  children,
  columns = 3,
  className = "",
}: DetailGridProps) {
  return (
    <dl className={["grid min-w-0 gap-2", columnClass[columns], className].join(" ")}>
      {children}
    </dl>
  );
}

export function DetailField({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "min-w-0 py-0.5",
        className,
      ].join(" ")}
    >
      <dt className={ui.fieldLabel}>{label}</dt>
      <dd className="mt-0.5 min-w-0 break-words text-sm leading-5 text-app-text-muted">
        {children ?? "-"}
      </dd>
    </div>
  );
}

export function DetailSection({
  title,
  children,
  className = "",
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "min-w-0 border-t border-app-border pt-3",
        className,
      ].join(" ")}
    >
      <h4 className={ui.fieldLabel}>{title}</h4>
      <div className="mt-2 min-w-0 text-sm text-app-text-muted">{children}</div>
    </section>
  );
}

export function DetailList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl className={["min-w-0 divide-y divide-app-border/70", className].join(" ")}>
      {children}
    </dl>
  );
}

export function DetailRow({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 py-1.5 text-xs sm:grid-cols-[10rem_minmax(0,1fr)]",
        className,
      ].join(" ")}
    >
      <dt className="min-w-0 break-words text-[11px] font-medium uppercase leading-4 text-app-text-subtle">
        {label}
      </dt>
      <dd className="min-w-0 break-words font-medium leading-4 text-app-text">
        {children ?? "-"}
      </dd>
    </div>
  );
}
