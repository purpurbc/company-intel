import type { ElementType, ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";
import { SourceNote } from "@/src/components/ui/SourceNote";

type SurfaceProps = {
  children: ReactNode;
  as?: ElementType;
  tone?: "panel" | "soft";
  padding?: "none" | "compact" | "default";
  className?: string;
};

const paddingClass = {
  none: "",
  compact: ui.panelPaddingCompact,
  default: ui.panelPadding,
} as const;

/** Standard bordered block. Radius, border, background and padding live here. */
export function Surface({
  children,
  as,
  tone = "panel",
  padding = "default",
  className = "",
}: SurfaceProps) {
  const Component = as ?? "section";
  return (
    <Component
      className={[
        "min-w-0",
        tone === "soft" ? ui.cardMuted : ui.card,
        paddingClass[padding],
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
}

type SectionProps = SurfaceProps & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
  source?: ReactNode;
};

/** Content panel with a shared internal title/action layout. */
export function Section({
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "",
  source,
  ...surfaceProps
}: SectionProps) {
  const hasHeader = title || description || actions;
  return (
    <Surface
      {...surfaceProps}
      className={[source ? "flex h-full flex-col" : "", className].join(" ")}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className={ui.sectionTitle}>{title}</h2> : null}
            {description ? (
              <div className={ui.sectionDescription}>{description}</div>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div
        className={[
          "min-w-0",
          hasHeader ? "mt-2.5" : "",
          source ? "flex-1" : "",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>
      {source ? <SourceNote>{source}</SourceNote> : null}
    </Surface>
  );
}

export function Inset({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={[ui.inset, className].join(" ")}>{children}</div>;
}
