import type { ReactNode } from "react";
import { TextLink } from "@/src/components/ui/TextLink";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <TextLink href={href}>
      {children}
    </TextLink>
  );
}
