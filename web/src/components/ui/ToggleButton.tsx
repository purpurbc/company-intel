"use client";

import type { ReactNode } from "react";
import {
  ui,
  uiControlSize,
  uiTextSize,
  type UiTextSize,
} from "@/src/lib/uiStyles";

type ToggleOption<T extends string> = {
  value: T;
  label: string;
  activeLabel?: string;
  icon?: ReactNode;
};

type ToggleButtonProps<T extends string> = {
  value: T;
  options: readonly [ToggleOption<T>, ToggleOption<T>];
  onChange: (value: T) => void;
  size?: "xs" | "sm" | "md";
  textSize?: UiTextSize;
  sameVariant?: boolean;
  iconOnly?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function ToggleButton<T extends string>({
  value,
  options,
  onChange,
  size = "xs",
  textSize = "xs",
  sameVariant = false,
  iconOnly = false,
  ariaLabel,
  className = "",
}: ToggleButtonProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div
      className={[ui.toggleGroup, className].join(" ")}
      role="group"
      aria-label={ariaLabel}
    >
      {!sameVariant ? (
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-sm bg-app-panel shadow-sm ring-1 ring-inset ring-app-border-strong transition-transform duration-200 ease-out motion-reduce:transition-none",
            activeIndex === 1 ? "translate-x-full" : "translate-x-0",
          ].join(" ")}
        />
      ) : null}
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            onClick={() => onChange(option.value)}
            className={[
              ui.toggleOption,
              iconOnly ? "h-6 w-6 p-0" : uiControlSize.toggle[size],
              uiTextSize[textSize],
              active && !sameVariant ? ui.toggleOptionActive : "",
              !active || sameVariant ? ui.toggleOptionIdle : "",
            ].join(" ")}
          >
            {option.icon}
            <span className={iconOnly ? "sr-only" : ""}>
              {active && option.activeLabel ? option.activeLabel : option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
