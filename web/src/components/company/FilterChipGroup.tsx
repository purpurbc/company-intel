"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { CountChip, FilterChip } from "@/src/components/ui/Chip";
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
      <div className="px-3 py-2.5">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <h3 className={ui.label}>{title}</h3>

              {selectedValues.length > 0 && (
                <CountChip>
                  {selectedValues.length} valda
                </CountChip>
              )}
            </div>

            <span className="text-app-text-subtle">
              <ChevronIcon expanded={open} />
            </span>
          </button>

          {headerControl ? (
            <div className="min-w-0 w-full">{headerControl}</div>
          ) : null}
        </div>
      </div>

      <AnimatedCollapse expanded={open} unmountWhenClosed>
        <div className={`border-t px-3 py-3 ${ui.divider}`}>
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
                    <FilterChip
                      key={option.value}
                      selected={selected}
                      onClick={() => onToggle(option.value)}
                    >
                      <span className="flex items-baseline gap-1.5 leading-snug">
                        {showOptionValues ? (
                          <strong className="font-bold">{option.value}</strong>
                        ) : null}
                        <span>{option.label}</span>
                      </span>
                    </FilterChip>
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
      </AnimatedCollapse>
    </div>
  );
}
