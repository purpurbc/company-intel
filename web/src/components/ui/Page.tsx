import type { ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";

type PageProps = {
  children: ReactNode;
  width?: "content" | "narrow" | "compact";
  className?: string;
  contentClassName?: string;
};

/** Standard application canvas, responsive gutter and content width. */
export function Page({
  children,
  width = "content",
  className = "",
  contentClassName = "",
}: PageProps) {
  return (
    <main className={[ui.page, className].join(" ")}>
      <div
        className={[
          width === "compact"
            ? ui.pageContentCompact
            : width === "narrow"
              ? ui.pageContentNarrow
              : ui.pageContent,
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
