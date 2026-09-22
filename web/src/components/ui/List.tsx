import type { ElementType, ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { EmptyState } from "@/src/components/ui/EmptyState";

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
  panel: ui.card,
  soft: ui.cardMuted,
  none: "",
};

const itemPadding: Record<ListDensity, string> = {
  compact: "px-3 py-2",
  comfortable: "px-3 py-2.5",
  spacious: "p-3",
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
        <div className="border-b border-app-border px-3 py-2.5">
          {header ?? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {eyebrow ? (
                  <p className={ui.eyebrow}>
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h2 className={[eyebrow ? "mt-1" : "", "text-lg font-semibold text-app-text"].join(" ")}>
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
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <AnimatedCollapse expanded={!collapsed}>
        {empty ? (
          <div className="p-3">
            <EmptyState title={empty} compact />
          </div>
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
      </AnimatedCollapse>
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
        interactive ? "transition-colors hover:bg-app-panel-hover-soft" : "",
        className,
      ].join(" ")}
    >
      {numbered ? (
        <div
          className={[
            "flex min-w-0 gap-3",
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
        "w-6 shrink-0 text-left text-xs tabular-nums text-app-text-subtle",
        compact ? "" : "pt-0.5",
      ].join(" ")}
    >
      {value.toLocaleString("sv-SE")}
    </span>
  );
}
