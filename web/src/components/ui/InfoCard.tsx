import type { ReactNode } from "react";

type InfoCardProps = {
  title?: string;
  children: ReactNode;
};

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <section className="border rounded p-4">
      {title ? <h2 className="font-semibold mb-2">{title}</h2> : null}
      {children}
    </section>
  );
}