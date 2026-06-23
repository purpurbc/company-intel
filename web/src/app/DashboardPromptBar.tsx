"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function DashboardPromptBar() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLTextAreaElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const lastContainerWidthRef = useRef(0);
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const [height, setHeight] = useState("36px");

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    const button = buttonRef.current;
    if (!container || !measure || !button) return;

    const syncLayout = (force = false) => {
      if (!force && container.clientWidth === lastContainerWidthRef.current) {
        return;
      }

      lastContainerWidthRef.current = container.clientWidth;

      const gap = 8;
      const containerStyles = window.getComputedStyle(container);
      const fullWidth = Math.max(
        container.clientWidth -
          parseFloat(containerStyles.paddingLeft) -
          parseFloat(containerStyles.paddingRight),
        120,
      );
      const inlineWidth = Math.max(fullWidth - button.offsetWidth - gap, 120);

      const styles = window.getComputedStyle(measure);
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingY =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const maxVisibleHeight = lineHeight * 4 + paddingY;

      const getContentHeight = (width: number) => {
        measure.style.width = `${width}px`;
        measure.style.height = "auto";
        return measure.scrollHeight;
      };

      measure.value = "x";
      const singleLineHeight = getContentHeight(inlineWidth);
      measure.value = value || " ";
      const inlineHeight = getContentHeight(inlineWidth);
      const nextExpanded = inlineHeight > singleLineHeight + 1;

      const contentHeight = getContentHeight(
        nextExpanded ? fullWidth : inlineWidth,
      );
      const nextHeight = Math.min(contentHeight, maxVisibleHeight);

      setExpanded(nextExpanded);
      setScrollable(contentHeight > maxVisibleHeight + 1);
      setHeight(`${Math.ceil(nextHeight)}px`);
    };

    syncLayout(true);
    const observer = new ResizeObserver(() => syncLayout());
    observer.observe(container);

    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mt-5 w-full max-w-3xl rounded-md border border-app-border bg-app-panel px-2 py-2 text-left shadow-[var(--app-shadow-soft)] transition-[border-color,background-color,box-shadow] focus-within:border-app-border-strong focus-within:bg-app-panel-hover"
    >
      <div
        className={[
          "flex gap-2 transition-[gap] duration-150 ease-out",
          expanded ? "flex-col items-stretch" : "items-end",
        ].join(" ")}
      >
        <label className="sr-only" htmlFor="dashboard-prompt">
          Sök
        </label>
        <div
          style={{ height }}
          className={[
            "min-h-9 overflow-hidden transition-[height] duration-150 ease-out",
            expanded ? "w-full" : "flex-1",
          ].join(" ")}
        >
          <textarea
            id="dashboard-prompt"
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Hitta nya kunder, segment och insikter..."
            className={[
              "h-full w-full resize-none rounded-sm border-0 bg-transparent px-2 py-2 text-sm leading-5 text-app-text outline-none placeholder:text-app-text-subtle focus:ring-0",
              scrollable
                ? "[direction:rtl] [scrollbar-gutter:stable] [unicode-bidi:plaintext] text-left"
                : "overflow-hidden",
            ].join(" ")}
          />
        </div>
        <div className={expanded ? "flex justify-end" : "contents"}>
          <button
            ref={buttonRef}
            type="button"
            className="h-9 shrink-0 rounded-sm border border-app-accent-border bg-app-accent-bg px-3 text-xs font-medium text-app-accent-text transition hover:border-app-accent-text hover:bg-app-panel-muted"
          >
            Sök
          </button>
        </div>
      </div>
      <textarea
        ref={measureRef}
        aria-hidden="true"
        tabIndex={-1}
        rows={1}
        readOnly
        className="pointer-events-none absolute left-2 top-2 h-0 resize-none overflow-hidden rounded-sm border-0 bg-transparent px-2 py-2 text-sm leading-5 opacity-0"
      />
    </div>
  );
}
