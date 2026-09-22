"use client";

import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

import { CountChip, FilterChip } from "@/src/components/ui/Chip";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ToggleButton } from "@/src/components/ui/ToggleButton";
import type { FilterOption } from "@/src/lib/companyFilterOptions";
import type { NumericRange } from "@/src/lib/companyNumericFilters";
import { ui } from "@/src/lib/uiStyles";

export type NumericFilterMode = "range" | "classes";
type RangeScale = "linear" | "logarithmic";

type NumericFilterCardProps = {
  title: string;
  value: NumericRange;
  min: number;
  max: number;
  onChange: (value: NumericRange) => void;
  onCommit: (value: NumericRange) => void;
  formatValue: (value: number) => string;
  unit: string;
  selectedCount?: number;
  scale?: RangeScale;
  mode?: NumericFilterMode;
  onModeChange?: (mode: NumericFilterMode) => void;
  options?: FilterOption[];
  selectedValues?: string[];
  onToggle?: (value: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function RangeNumberInput({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    if (!draft.trim()) {
      setDraft(String(value));
      return;
    }

    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    const normalized = Math.round(clamp(parsed, min, max));
    setDraft(String(normalized));
    onCommit(normalized);
  }

  return (
    <label className="min-w-0 space-y-1">
      <span className={ui.fieldLabel}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(value));
          }
        }}
        className={`${ui.input} h-7 min-w-0`}
      />
    </label>
  );
}

function NumericRangeControl({
  value,
  min,
  max,
  onChange,
  onCommit,
  formatValue,
  unit,
  scale = "linear",
}: Pick<
  NumericFilterCardProps,
  | "value"
  | "min"
  | "max"
  | "onChange"
  | "onCommit"
  | "formatValue"
  | "unit"
  | "scale"
>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<NumericRange>(value);
  const dragRef = useRef<{
    pointerId: number;
    handle: "min" | "max" | "pending";
    startValue: number;
  } | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function valueToRatio(current: number) {
    const bounded = clamp(current, min, max);
    if (max <= min) return 0;
    if (scale === "logarithmic") {
      return Math.log1p(bounded - min) / Math.log1p(max - min);
    }
    return (bounded - min) / (max - min);
  }

  function ratioToValue(ratio: number) {
    const boundedRatio = clamp(ratio, 0, 1);
    const raw =
      scale === "logarithmic"
        ? min + Math.expm1(Math.log1p(max - min) * boundedRatio)
        : min + (max - min) * boundedRatio;
    return Math.round(clamp(raw, min, max));
  }

  function valueFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return valueRef.current[0];
    return ratioToValue((clientX - rect.left) / rect.width);
  }

  function setRange(next: NumericRange) {
    valueRef.current = next;
    onChange(next);
  }

  function updateRange(nextValue: number) {
    const current = valueRef.current;
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.handle === "pending") {
      if (nextValue < drag.startValue) drag.handle = "min";
      else if (nextValue > drag.startValue) drag.handle = "max";
      else return;
    }

    setRange(
      drag.handle === "min"
        ? [Math.min(nextValue, current[1]), current[1]]
        : [current[0], Math.max(nextValue, current[0])],
    );
  }

  function beginDrag(
    event: ReactPointerEvent,
    handle: "min" | "max" | "auto",
  ) {
    event.preventDefault();
    event.stopPropagation();

    const current = valueRef.current;
    const nextValue = valueFromPointer(event.clientX);
    let nextHandle: "min" | "max" | "pending";

    if (handle === "auto") {
      if (current[0] === current[1]) {
        nextHandle =
          nextValue < current[0]
            ? "min"
            : nextValue > current[1]
              ? "max"
              : "pending";
      } else {
        nextHandle =
          Math.abs(nextValue - current[0]) <=
          Math.abs(nextValue - current[1])
            ? "min"
            : "max";
      }
    } else {
      nextHandle = current[0] === current[1] ? "pending" : handle;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      handle: nextHandle,
      startValue: current[0] === current[1] ? current[0] : nextValue,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    updateRange(nextValue);
  }

  function continueDrag(event: ReactPointerEvent) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    updateRange(valueFromPointer(event.clientX));
  }

  function endDrag(event: ReactPointerEvent) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    onCommit(valueRef.current);
  }

  function commitBound(handle: "min" | "max", nextValue: number) {
    const current = valueRef.current;
    const next: NumericRange =
      handle === "min"
        ? [Math.min(nextValue, current[1]), current[1]]
        : [current[0], Math.max(nextValue, current[0])];
    setRange(next);
    onCommit(next);
  }

  function handleKeyDown(
    event: ReactKeyboardEvent,
    handle: "min" | "max",
  ) {
    const current = valueRef.current;
    const currentValue = handle === "min" ? current[0] : current[1];
    const pageStep = Math.max(10, Math.round((max - min) / 20));
    let nextValue: number | undefined;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextValue = currentValue - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextValue = currentValue + 1;
    } else if (event.key === "PageDown") {
      nextValue = currentValue - pageStep;
    } else if (event.key === "PageUp") {
      nextValue = currentValue + pageStep;
    } else if (event.key === "Home") {
      nextValue = min;
    } else if (event.key === "End") {
      nextValue = max;
    }

    if (nextValue === undefined) return;
    event.preventDefault();
    commitBound(handle, clamp(nextValue, min, max));
  }

  const startPercent = valueToRatio(value[0]) * 100;
  const endPercent = valueToRatio(value[1]) * 100;
  const selectionStyle = {
    left: `${startPercent}%`,
    right: `${100 - endPercent}%`,
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-app-text-subtle">
        {formatValue(value[0])}–{formatValue(value[1])} {unit}
      </div>

      <div
        className="relative isolate h-7 touch-none"
        onPointerDown={(event) => beginDrag(event, "auto")}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div ref={trackRef} className="absolute inset-x-2 top-3 h-1">
          <div className="absolute inset-0 rounded-full bg-app-border" />
          <div
            className="absolute inset-y-0 rounded-full bg-app-accent"
            style={selectionStyle}
          />

          {(["min", "max"] as const).map((handle) => {
            const currentValue = handle === "min" ? value[0] : value[1];
            return (
              <button
                key={handle}
                type="button"
                role="slider"
                aria-label={
                  handle === "min" ? "Minsta värde" : "Högsta värde"
                }
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={currentValue}
                aria-valuetext={`${formatValue(currentValue)} ${unit}`}
                className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-app-accent shadow-[0_0_0_3px_var(--app-panel),0_1px_4px_rgb(0_0_0/0.28)] outline-none transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-app-focus"
                style={{ left: `${valueToRatio(currentValue) * 100}%` }}
                onPointerDown={(event) => beginDrag(event, handle)}
                onKeyDown={(event) => handleKeyDown(event, handle)}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <RangeNumberInput
          label="Min"
          value={value[0]}
          min={min}
          max={value[1]}
          onCommit={(nextValue) => commitBound("min", nextValue)}
        />
        <span
          aria-hidden="true"
          className="flex h-7 items-center text-sm text-app-text-subtle"
        >
          –
        </span>
        <RangeNumberInput
          label="Max"
          value={value[1]}
          min={value[0]}
          max={max}
          onCommit={(nextValue) => commitBound("max", nextValue)}
        />
      </div>
    </div>
  );
}

/** Shared presentation for exact numeric ranges and source-provided classes. */
export function NumericFilterCard({
  title,
  selectedCount = 0,
  mode = "range",
  onModeChange,
  options = [],
  selectedValues = [],
  onToggle,
  ...rangeProps
}: NumericFilterCardProps) {
  const supportsClasses = Boolean(onModeChange && onToggle && options.length);

  return (
    <div className={ui.card}>
      <div className="space-y-3 p-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className={ui.label}>{title}</h3>
            {selectedCount > 0 ? (
              <CountChip>
                {selectedCount === 1 ? "1 valt" : `${selectedCount} valda`}
              </CountChip>
            ) : null}
          </div>

          {supportsClasses ? (
            <ToggleButton<NumericFilterMode>
              value={mode}
              onChange={(nextMode) => onModeChange?.(nextMode)}
              iconOnly
              ariaLabel={`Visningsläge för ${title.toLowerCase()}`}
              options={[
                {
                  value: "range",
                  label: "Intervall",
                  icon: (
                    <MaskedIcon
                      src="/icons/utility/single_slider.svg"
                      className="h-3.5 w-3.5"
                    />
                  ),
                },
                {
                  value: "classes",
                  label: "Klasser",
                  icon: (
                    <MaskedIcon
                      src="/icons/utility/four_squares.svg"
                      className="h-3.5 w-3.5"
                    />
                  ),
                },
              ]}
            />
          ) : null}
        </div>

        {mode === "classes" && supportsClasses ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((option) => (
              <FilterChip
                key={option.value}
                selected={selectedValues.includes(option.value)}
                onClick={() => onToggle?.(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        ) : (
          <NumericRangeControl {...rangeProps} />
        )}
      </div>
    </div>
  );
}
