import type { ElementType, ReactNode } from "react";

type ListDensity = "compact" | "comfortable" | "spacious";
type ListSurface = "panel" | "soft" | "none";
type ListTone = "default" | "muted" | "active";

type ListProps = {
  children: ReactNode;
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  header?: ReactNode;
  collapsed?: boolean;
  empty?: ReactNode;
  surface?: ListSurface;
  divided?: boolean;
  className?: string;
  contentClassName?: string;
};

type ListItemProps = {
  children: ReactNode;
  as?: ElementType;
  compact?: boolean;
  density?: ListDensity;
  tone?: ListTone;
  numbered?: boolean;
  index?: number;
  interactive?: boolean;
  className?: string;
  contentClassName?: string;
};

const surfaceClass: Record<ListSurface, string> = {
  panel: "border border-app-border bg-app-panel",
  soft: "border border-app-border bg-app-panel-soft",
  none: "",
};

const itemPadding: Record<ListDensity, string> = {
  compact: "px-4 py-2.5",
  comfortable: "p-4",
  spacious: "p-5",
};

const itemTone: Record<ListTone, string> = {
  default: "",
  muted: "bg-app-panel-soft",
  active: "bg-app-accent-bg",
};

export function List({
  children,
  title,
  eyebrow,
  description,
  actions,
  header,
  collapsed = false,
  empty,
  surface = "panel",
  divided = true,
  className = "",
  contentClassName = "",
}: ListProps) {
  const hasHeader = Boolean(header ?? title ?? eyebrow ?? description ?? actions);

  return (
    <section
      className={["overflow-hidden rounded-md", surfaceClass[surface], className].join(" ")}
    >
      {hasHeader ? (
        <div className="border-b border-app-border p-4">
          {header ?? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h2 className="mt-1 text-lg font-semibold text-app-text">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm text-app-text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {collapsed ? null : empty ? (
        <div className="p-5 text-sm text-app-text-subtle">{empty}</div>
      ) : (
        <div
          className={[
            divided ? "divide-y divide-app-border" : "",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </div>
      )}
    </section>
  );
}

export function ListItem({
  children,
  as,
  compact = false,
  density,
  tone = "default",
  numbered = false,
  index,
  interactive = true,
  className = "",
  contentClassName = "",
}: ListItemProps) {
  const Component = as ?? "article";
  const resolvedDensity = density ?? (compact ? "compact" : "comfortable");

  return (
    <Component
      className={[
        itemPadding[resolvedDensity],
        itemTone[tone],
        interactive ? "transition hover:bg-app-panel-hover" : "",
        className,
      ].join(" ")}
    >
      {numbered ? (
        <div
          className={[
            "flex min-w-0 gap-4",
            compact ? "items-center" : "items-start",
            contentClassName,
          ].join(" ")}
        >
          <ListItemNumber value={index} compact={compact} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        <div className={["min-w-0", contentClassName].join(" ")}>
          {children}
        </div>
      )}
    </Component>
  );
}

export function ListItemNumber({
  value,
  compact = false,
}: {
  value?: number;
  compact?: boolean;
}) {
  if (typeof value !== "number") return null;

  return (
    <span
      className={[
        "w-8 shrink-0 text-right text-xs tabular-nums text-app-text-subtle",
        compact ? "" : "pt-0.5",
      ].join(" ")}
    >
      {value.toLocaleString("sv-SE")}
    </span>
  );
}
