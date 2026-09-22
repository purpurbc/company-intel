import type { ReactNode } from "react";

type FeedbackProps = {
  children: ReactNode;
  tone?: "muted" | "danger" | "warning";
  className?: string;
};

const toneClass = {
  muted: "border-app-border bg-app-panel-soft text-app-text-muted",
  danger: "border-app-danger-border bg-app-danger-bg text-app-danger-text",
  warning: "border-app-warning-border bg-app-warning-bg text-app-warning-text",
} as const;

export function Feedback({
  children,
  tone = "muted",
  className = "",
}: FeedbackProps) {
  return (
    <div
      className={[
        "rounded-md border px-3 py-2 text-xs",
        toneClass[tone],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
