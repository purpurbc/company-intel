"use client";

import { useCallback, useState } from "react";
import type { AnimationEvent } from "react";

/** Keeps a popover mounted until its short exit animation has completed. */
export function usePopoverPresence() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const openPopover = useCallback(() => {
    setIsMounted(true);
    setIsOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handlePopoverAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLElement>) => {
      if (event.target === event.currentTarget && !isOpen) {
        setIsMounted(false);
      }
    },
    [isOpen],
  );

  return {
    isOpen,
    isMounted,
    openPopover,
    closePopover,
    handlePopoverAnimationEnd,
    motionClassName: isOpen ? "app-popover-enter" : "app-popover-exit",
  };
}
