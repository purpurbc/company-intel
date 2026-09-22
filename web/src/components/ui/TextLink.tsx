import Link from "next/link";
import type { ReactNode } from "react";

type TextLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export const textLinkClassName =
  "border-b-2 border-app-border-strong pb-0.5 font-medium text-app-text transition hover:border-app-accent-border hover:text-app-accent-text";

export const textLinkGroupClassName =
  "group inline-flex min-w-0 items-baseline gap-2 text-app-text transition hover:text-app-accent-text";

export const textLinkGroupedUnderlineClassName =
  "min-w-0 truncate border-b-2 border-app-border-strong pb-0.5 transition group-hover:border-app-accent-border";

export function TextLink({ href, children, className = "" }: TextLinkProps) {
  return (
    <Link href={href} className={[textLinkClassName, className].join(" ")}>
      {children}
    </Link>
  );
}
