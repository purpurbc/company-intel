"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { FilterOption } from "@/src/lib/companyFilterOptions";
import { ui } from "@/src/lib/uiStyles";

type FilterChipGroupProps = {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  emptyText?: string;
  defaultOpen?: boolean;
  showOptionValues?: boolean;
  headerControl?: ReactNode;
};

export function FilterChipGroup({
  title,
  options,
  selectedValues,
  onToggle,
  searchable = false,
  searchValue = "",
  onSearchChange,
  emptyText = "Inga val hittades.",
  defaultOpen = false,
  showOptionValues = false,
  headerControl,
}: FilterChipGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={ui.card}>
      <div className="px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>

              {selectedValues.length > 0 && (
                <span className={ui.countChip}>
                  {selectedValues.length} valda
                </span>
              )}
            </div>

            <span
              className={[
                "text-sm text-slate-500 transition-transform",
                open ? "rotate-180" : "",
              ].join(" ")}
            >
              v
            </span>
          </button>

          {headerControl ? (
            <div className="min-w-0 lg:w-96">{headerControl}</div>
          ) : null}
        </div>
      </div>

      {open && (
        <div className={`border-t px-4 py-4 ${ui.divider}`}>
          <div className="space-y-3">
            {searchable && onSearchChange && (
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Sök i ${title.toLowerCase()}`}
                className={ui.input}
              />
            )}

            {options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected = selectedValues.includes(option.value);
                  const label = showOptionValues
                    ? `${option.value} ${option.label}`
                    : option.label;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onToggle(option.value)}
                      className={[
                        ui.chip,
                        selected ? ui.chipSelected : "",
                      ].join(" ")}
                    >
                      <span className="block leading-snug">{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className={`rounded-md border border-dashed px-3 py-4 ${ui.divider} ${ui.helpText}`}
              >
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
