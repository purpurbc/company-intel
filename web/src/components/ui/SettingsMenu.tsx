"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { usePopoverPresence } from "@/src/components/ui/usePopoverPresence";
import {
  APP_THEME_CHANGE_EVENT,
  applyColorMode,
  currentColorMode,
  type ColorMode,
} from "@/src/lib/appTheme";

const destinations = [
  { href: "/components", label: "Komponenter", icon: "/icons/menu/filter.svg" },
  { href: "/admin", label: "Admin", icon: "/icons/menu/king.svg" },
  { href: "/settings", label: "Inställningar", icon: "/icons/menu/gear.svg" },
];

const PANEL_WIDTH = 208;
const PANEL_HEIGHT = 148;

export function SettingsMenu({ compact = false }: { compact?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [mode, setMode] = useState<ColorMode>("dark");
  const {
    isOpen,
    isMounted,
    openPopover,
    closePopover,
    handlePopoverAnimationEnd,
    motionClassName,
  } = usePopoverPresence();
  const {
    isOpen: isModeOpen,
    isMounted: isModeMounted,
    openPopover: openModePopover,
    closePopover: closeModePopover,
    handlePopoverAnimationEnd: handleModeAnimationEnd,
    motionClassName: modeMotionClassName,
  } = usePopoverPresence();

  useEffect(() => {
    const syncMode = () => setMode(currentColorMode());
    syncMode();
    window.addEventListener(APP_THEME_CHANGE_EVENT, syncMode);
    return () => window.removeEventListener(APP_THEME_CHANGE_EVENT, syncMode);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        closeModePopover();
        closePopover();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isModeOpen) closeModePopover();
      else closePopover();
    };
    const closeOnResize = () => {
      closeModePopover();
      closePopover();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [closeModePopover, closePopover, isModeOpen, isOpen]);

  function toggleMenu() {
    if (isOpen) {
      closeModePopover();
      closePopover();
      return;
    }

    const trigger = rootRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const sidebar = rootRef.current?.closest("aside")?.getBoundingClientRect();
    const desiredTop = trigger.top + trigger.height / 2 - PANEL_HEIGHT / 2;
    setPosition({
      left: Math.max(8, Math.min((sidebar?.right ?? trigger.right) + 8, window.innerWidth - PANEL_WIDTH - 168)),
      top: Math.max(8, Math.min(desiredTop, window.innerHeight - PANEL_HEIGHT - 8)),
    });
    openPopover();
  }

  function selectMode(nextMode: ColorMode) {
    applyColorMode(nextMode);
    closeModePopover();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={isOpen ? "Stäng inställningsmeny" : "Öppna inställningsmeny"}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={toggleMenu}
        className={`flex items-center rounded-md text-sm text-app-text-muted transition hover:bg-app-panel-muted hover:text-app-text ${compact ? "ml-0.5 h-8 w-8" : "h-8 w-full gap-1 pr-2"}`}
      >
        <span className={`flex h-8 shrink-0 items-center justify-center ${compact ? "w-8" : "w-9"}`}>
          <MaskedIcon src="/icons/menu/gear.svg" />
        </span>
        {!compact ? <span className="truncate">Inställningar</span> : null}
      </button>

      {isMounted ? createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label="Inställningar"
          style={position}
          onAnimationEnd={handlePopoverAnimationEnd}
          className={`fixed z-[70] w-52 rounded-md border border-app-border bg-app-panel p-1 shadow-[var(--app-shadow-float)] ${motionClassName}`}
        >
          <div
            className="relative"
            onMouseEnter={openModePopover}
            onMouseLeave={closeModePopover}
          >
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isModeOpen}
              onClick={openModePopover}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm text-app-text-muted hover:bg-app-panel-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
            >
              <MaskedIcon src={mode === "dark" ? "/icons/menu/moon-svgrepo-com.svg" : "/icons/menu/sun-svgrepo-com.svg"} />
              <span className="flex-1">Visningsläge</span>
              <MaskedIcon src="/icons/utility/arrow_right.svg" className="h-3.5 w-3.5" />
            </button>
            {isModeMounted ? (
              <>
                <span aria-hidden="true" className="absolute left-full top-0 h-8 w-1" />
                <div
                  role="menu"
                  aria-label="Visningsläge"
                  onAnimationEnd={handleModeAnimationEnd}
                  className={`absolute left-[calc(100%+0.25rem)] -top-1 z-[71] w-40 rounded-md border border-app-border bg-app-panel p-1 shadow-[var(--app-shadow-float)] ${modeMotionClassName}`}
                >
                  {(["light", "dark"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      role="menuitemradio"
                      aria-checked={mode === choice}
                      onClick={() => selectMode(choice)}
                      className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm text-app-text-muted hover:bg-app-panel-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                      <MaskedIcon src={choice === "light" ? "/icons/menu/sun-svgrepo-com.svg" : "/icons/menu/moon-svgrepo-com.svg"} />
                      <span className="flex-1">{choice === "light" ? "Ljust" : "Mörkt"}</span>
                      {mode === choice ? <MaskedIcon src="/icons/utility/check.svg" className="h-4 w-4 text-app-accent-text" /> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <div className="my-1 border-t border-app-border" />
          {destinations.map((destination) => (
            <Link
              key={destination.href}
              href={destination.href}
              role="menuitem"
              onClick={() => { closeModePopover(); closePopover(); }}
              className="flex h-8 items-center gap-2 rounded-sm px-2 text-sm text-app-text-muted hover:bg-app-panel-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
            >
              <MaskedIcon src={destination.icon} />
              {destination.label}
            </Link>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
