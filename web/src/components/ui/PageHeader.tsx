import type { ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";

type PageHeaderProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  titleAdornment?: ReactNode;
  className?: string;
};

/** One consistent title hierarchy for index, detail and workspace pages. */
export function PageHeader({
  title,
  eyebrow,
  meta,
  actions,
  aside,
  titleAdornment,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={[ui.pageHeader, className].join(" ")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className={ui.eyebrow}>{eyebrow}</p> : null}
          <h1
            className={[
              ui.pageTitle,
              "flex min-w-0 flex-wrap items-baseline gap-x-2",
              eyebrow ? "mt-1" : "",
            ].join(" ")}
          >
            {title}
            {titleAdornment}
          </h1>
          {meta ? (
            <div className="mt-2 space-y-0.5 text-sm leading-5 text-app-text-muted">
              {meta}
            </div>
          ) : null}
        </div>

        {aside || actions ? (
          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            {aside}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

type SectionHeadingProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeading({
  title,
  eyebrow,
  description,
  actions,
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow ? <p className={ui.eyebrow}>{eyebrow}</p> : null}
        <h2 className={["text-lg font-semibold text-app-text", eyebrow ? "mt-1" : ""].join(" ")}>
          {title}
        </h2>
        {description ? (
          <div className={ui.sectionDescription}>{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
