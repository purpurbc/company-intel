"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ui,
  uiRadius,
  uiTextSize,
  type UiRadius,
  type UiTextSize,
} from "@/src/lib/uiStyles";

type SelectMenuOption<T extends string> = {
  value: T;
  label: string;
};

type SelectMenuProps<T extends string> = {
  label: string;
  options: SelectMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  align?: "left" | "right";
  compact?: boolean;
  radius?: UiRadius;
  textSize?: UiTextSize;
};

const OPEN_EVENT = "company-intel-select-open";

export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
  align = "right",
  compact = false,
  radius = "md",
  textSize = "sm",
}: SelectMenuProps<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onOtherOpen(event: Event) {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== id) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOtherOpen);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
    };
  }, [id, open]);

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { id } }));
      }
      return next;
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className={[
          ui.selectMenuButton,
          uiRadius[radius],
          uiTextSize[textSize],
          compact ? "px-3 py-2" : "px-3 py-2.5",
        ].join(" ")}
        aria-expanded={open}
      >
        <span className="text-app-text-muted">{label}</span>
        <span className="min-w-0 truncate text-app-text">
          {selected?.label ?? "-"}
        </span>
        <span
          aria-hidden="true"
          className={[
            "shrink-0 text-xs text-app-text-subtle transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          v
        </span>
      </button>

      {open ? (
        <div
          className={[
            ui.selectMenuPanel,
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={[
                ui.selectMenuOption,
                option.value === value
                  ? ui.selectMenuOptionActive
                  : ui.selectMenuOptionIdle,
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
