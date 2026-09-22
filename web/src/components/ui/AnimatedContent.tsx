import type { ReactNode } from "react";

/** Small entrance motion used when a page swaps between tabbed content blocks. */
export function AnimatedContent({ children }: { children: ReactNode }) {
  return <div className="app-content-enter">{children}</div>;
}
