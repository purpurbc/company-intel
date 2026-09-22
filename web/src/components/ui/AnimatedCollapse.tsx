"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, TransitionEvent } from "react";
import { uiMotion } from "@/src/lib/uiMotion";

type AnimatedCollapseProps = {
  expanded: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  inertWhenClosed?: boolean;
  allowOverflowWhenExpanded?: boolean;
  unmountWhenClosed?: boolean;
  onTransitionComplete?: (expanded: boolean) => void;
};

/** Shared height/opacity motion for content that expands in place. */
export function AnimatedCollapse({
  expanded,
  children,
  className = "",
  contentClassName = "",
  inertWhenClosed = true,
  allowOverflowWhenExpanded = false,
  unmountWhenClosed = false,
  onTransitionComplete,
}: AnimatedCollapseProps) {
  const [contentUnmounted, setContentUnmounted] = useState(
    unmountWhenClosed && !expanded,
  );
  const transitionCallbackRef = useRef(onTransitionComplete);
  const shouldRender = !unmountWhenClosed || expanded || !contentUnmounted;

  useEffect(() => {
    transitionCallbackRef.current = onTransitionComplete;
  }, [onTransitionComplete]);

  function handleTransitionStart(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "grid-template-rows" &&
      expanded &&
      unmountWhenClosed
    ) {
      setContentUnmounted(false);
    }
  }

  function handleTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "grid-template-rows"
    ) {
      return;
    }

    if (unmountWhenClosed) setContentUnmounted(!expanded);
    transitionCallbackRef.current?.(expanded);
  }

  return (
    <div
      data-expanded={expanded ? "true" : "false"}
      aria-hidden={!expanded}
      inert={inertWhenClosed && !expanded}
      onTransitionStart={handleTransitionStart}
      onTransitionEnd={handleTransitionEnd}
      className={[
        "grid min-w-0 max-w-full transition-[grid-template-rows,opacity]",
        uiMotion.collapse,
        expanded
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "min-h-0 min-w-0 max-w-full",
          allowOverflowWhenExpanded && expanded
            ? "overflow-visible"
            : "overflow-hidden",
          contentClassName,
        ].join(" ")}
      >
        {shouldRender ? children : null}
      </div>
    </div>
  );
}
