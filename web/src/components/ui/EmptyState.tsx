import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** Consistent empty state for pages, panels and lists. */
export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-start justify-center text-app-text-muted",
        compact ? "gap-1 py-1 text-sm" : "min-h-48 gap-2 text-sm",
        className,
      ].join(" ")}
    >
      <div className="font-semibold text-app-text">{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
