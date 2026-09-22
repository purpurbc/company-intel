import type { ReactNode } from "react";
import { Section } from "@/src/components/ui/Surface";

type InfoCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <Section title={title} className={className}>
      {children}
    </Section>
  );
}
