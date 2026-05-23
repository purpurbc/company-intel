"use client";

import { useState } from "react";
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
}: FilterChipGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={ui.card}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>

          {selectedValues.length > 0 && (
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
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
                      <span className="block leading-snug">{option.label}</span>
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
