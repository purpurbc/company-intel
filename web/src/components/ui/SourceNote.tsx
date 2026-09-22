import type { ReactNode } from "react";

export function SourceNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mt-4 border-t border-app-border/70 pt-3 text-[11px] text-app-text-subtle">
      Källa: <span className="font-medium text-app-text-muted">{children}</span>
    </div>
  );
}
