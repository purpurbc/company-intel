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
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      {title ? (
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}