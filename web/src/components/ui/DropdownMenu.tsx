"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { buttonClassName, type ButtonVariant } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ui } from "@/src/lib/uiStyles";
import { usePopoverPresence } from "@/src/components/ui/usePopoverPresence";

export type DropdownMenuItem = {
  key: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  closeOnSelect?: boolean;
  onSelect?: () => void | Promise<void>;
};

type DropdownMenuProps = {
  label: string;
  icon: ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
  triggerText?: string;
};

const OPEN_EVENT = "company-intel-dropdown-open";

/** Shared icon-triggered action/sort menu with one predictable close behavior. */
export function DropdownMenu({
  label,
  icon,
  items,
  align = "right",
  className = "",
  triggerVariant = "secondary",
  triggerClassName = "",
  triggerText,
}: DropdownMenuProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const {
    isOpen,
    isMounted,
    openPopover,
    closePopover,
    handlePopoverAnimationEnd,
    motionClassName,
  } = usePopoverPresence();

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closePopover();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePopover();
    }

    function onOtherOpen(event: Event) {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== id) closePopover();
    }

    function closeMenu() {
      closePopover();
    }

    function closeOnOuterScroll(event: Event) {
      if (panelRef.current?.contains(event.target as Node)) return;
      closePopover();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeOnOuterScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeOnOuterScroll, true);
    };
  }, [closePopover, id, isOpen]);

  function toggle() {
    if (isOpen) {
      closePopover();
      return;
    }

    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const panelWidth = Math.min(224, document.documentElement.clientWidth - 16);
      const panelHeight = Math.min(items.length * 32 + 8, 288);
      const desiredLeft = align === "right" ? rect.right - panelWidth : rect.left;
      const openAbove = rect.bottom + 8 + panelHeight > window.innerHeight;
      setPosition({
        left: Math.max(8, Math.min(desiredLeft, window.innerWidth - panelWidth - 8)),
        top: openAbove
          ? Math.max(8, rect.top - panelHeight - 8)
          : rect.bottom + 8,
      });
    }
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { id } }));
    openPopover();
  }

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={buttonClassName({
          variant: triggerVariant,
          size: triggerText ? "sm" : "icon",
          className: triggerClassName,
        })}
      >
        {icon}
        {triggerText}
      </button>

      {isMounted ? createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          style={position}
          onAnimationEnd={handlePopoverAnimationEnd}
          className={["fixed z-50 max-h-72 w-56 max-w-[calc(100vw-16px)] overflow-auto rounded-md border border-app-border bg-app-panel py-1 shadow-[var(--app-shadow-panel)]", motionClassName].join(" ")}
        >
          {items.map((item) => {
            const itemClassName = [
              ui.selectMenuOption,
              "flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
              item.active ? ui.selectMenuOptionActive : ui.selectMenuOptionIdle,
            ].join(" ");
            const itemContent = (
              <>
                {item.icon}
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.active ? (
                  <MaskedIcon
                    src="/icons/utility/check.svg"
                    className="ml-auto h-4 w-4 text-app-accent-text"
                  />
                ) : null}
              </>
            );
            if (item.href && !item.disabled) {
              return (
                <Fragment key={item.key}>
                  {item.separatorBefore ? (
                    <div role="separator" className="my-1 border-t border-app-border" />
                  ) : null}
                  <Link
                    href={item.href}
                    role="menuitem"
                    className={itemClassName}
                    onClick={() => {
                      closePopover();
                      void item.onSelect?.();
                    }}
                  >
                    {itemContent}
                  </Link>
                </Fragment>
              );
            }

            return (
              <Fragment key={item.key}>
                {item.separatorBefore ? (
                  <div role="separator" className="my-1 border-t border-app-border" />
                ) : null}
                <button
                  type="button"
                  role={item.selectable ? "menuitemcheckbox" : "menuitem"}
                  aria-checked={item.selectable ? Boolean(item.active) : undefined}
                  disabled={item.disabled}
                  className={itemClassName}
                  onClick={() => {
                    if (item.closeOnSelect !== false) closePopover();
                    void item.onSelect?.();
                  }}
                >
                  {itemContent}
                </button>
              </Fragment>
            );
          })}
        </div>
      , document.body) : null}
    </div>
  );
}
