import Link from "next/link";
import type { ReactNode } from "react";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link href={href} className="hover:underline">
      {children}
    </Link>
  );
}