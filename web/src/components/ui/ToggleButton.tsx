"use client";

import { ui, uiTextSize, type UiTextSize } from "@/src/lib/uiStyles";

type ToggleOption<T extends string> = {
  value: T;
  label: string;
  activeLabel?: string;
};

type ToggleButtonProps<T extends string> = {
  value: T;
  options: readonly [ToggleOption<T>, ToggleOption<T>];
  onChange: (value: T) => void;
  size?: "xs" | "sm" | "md";
  textSize?: UiTextSize;
  sameVariant?: boolean;
  ariaLabel?: string;
  className?: string;
};

const sizeClass = {
  xs: "px-2 py-1",
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2",
} as const;

export function ToggleButton<T extends string>({
  value,
  options,
  onChange,
  size = "xs",
  textSize = "xs",
  sameVariant = false,
  ariaLabel,
  className = "",
}: ToggleButtonProps<T>) {
  return (
    <div
      className={[ui.toggleGroup, className].join(" ")}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              ui.toggleOption,
              sizeClass[size],
              uiTextSize[textSize],
              active && !sameVariant ? ui.toggleOptionActive : "",
              !active || sameVariant ? ui.toggleOptionIdle : "",
            ].join(" ")}
          >
            {active && option.activeLabel ? option.activeLabel : option.label}
          </button>
        );
      })}
    </div>
  );
}
