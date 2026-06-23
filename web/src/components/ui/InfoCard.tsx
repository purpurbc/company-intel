import type { ReactNode } from "react";

type InfoCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <section
      className={[
        "rounded-md border border-app-border bg-app-panel p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-app-text">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
