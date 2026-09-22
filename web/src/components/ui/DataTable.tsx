"use client";

import { useMemo, useState, type ReactNode } from "react";

import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";

export type DataTableColumn = {
  key: string;
  label: ReactNode;
  align?: "left" | "right";
  className?: string;
};

export type DataTableRow = {
  key: string;
  cells: Record<string, ReactNode>;
  sortValues?: Record<string, string | number | null>;
};

export type DataTableProps = {
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  caption: string;
  emptyText?: string;
  sortable?: boolean;
  showColumnDividersToggle?: boolean;
  defaultShowColumnDividers?: boolean;
  columnDividerMode?: ColumnDividerMode;
  onColumnDividerModeChange?: (mode: ColumnDividerMode) => void;
};

type SortDirection = "ascending" | "descending";
export type ColumnDividerMode = "hidden" | "visible";

export function DataTableColumnDividerToggle({
  value,
  onChange,
}: {
  value: ColumnDividerMode;
  onChange: (mode: ColumnDividerMode) => void;
}) {
  return (
    <DropdownMenu
      label="Kolumnlinjer"
      triggerText="Kolumnlinjer"
      triggerVariant="ghost"
      icon={<MaskedIcon src="/icons/utility/compact_list.svg" className="h-4 w-4" />}
      items={[
        {
          key: "hidden",
          active: value === "hidden",
          onSelect: () => onChange("hidden"),
          label: "Utan kolumnlinjer",
          icon: (
            <MaskedIcon
              src="/icons/utility/compact_list.svg"
              className="h-4 w-4"
            />
          ),
        },
        {
          key: "visible",
          active: value === "visible",
          onSelect: () => onChange("visible"),
          label: "Med kolumnlinjer",
          icon: (
            <MaskedIcon
              src="/icons/utility/four_squares.svg"
              className="h-4 w-4"
            />
          ),
        },
      ]}
    />
  );
}

function rowSortValue(row: DataTableRow, columnKey: string) {
  const explicitValue = row.sortValues?.[columnKey];
  if (explicitValue !== undefined) return explicitValue;

  const cell = row.cells[columnKey];
  return typeof cell === "string" || typeof cell === "number" ? cell : null;
}

function compareSortValues(
  left: string | number | null,
  right: string | number | null,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;

  return String(left).localeCompare(String(right), "sv-SE", {
    numeric: true,
    sensitivity: "base",
  });
}

/** Dense, horizontally scrollable data table for comparable time series. */
export function DataTable({
  columns,
  rows,
  caption,
  emptyText = "Ingen data finns i underlaget.",
  sortable = false,
  showColumnDividersToggle = false,
  defaultShowColumnDividers = false,
  columnDividerMode,
  onColumnDividerModeChange,
}: DataTableProps) {
  const [sort, setSort] = useState<{
    columnKey: string;
    direction: SortDirection;
  } | null>(null);
  const [internalColumnDividerMode, setInternalColumnDividerMode] =
    useState<ColumnDividerMode>(
      defaultShowColumnDividers ? "visible" : "hidden",
    );
  const activeColumnDividerMode = columnDividerMode ?? internalColumnDividerMode;
  const setColumnDividerMode =
    onColumnDividerModeChange ?? setInternalColumnDividerMode;

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const leftValue = rowSortValue(left.row, sort.columnKey);
        const rightValue = rowSortValue(right.row, sort.columnKey);
        if (leftValue === null && rightValue === null) {
          return left.index - right.index;
        }
        if (leftValue === null) return 1;
        if (rightValue === null) return -1;

        const result = compareSortValues(leftValue, rightValue);
        if (result === 0) return left.index - right.index;
        return sort.direction === "ascending" ? result : -result;
      })
      .map(({ row }) => row);
  }, [rows, sort]);

  function toggleSort(columnKey: string) {
    setSort((current) => {
      if (!current || current.columnKey !== columnKey) {
        return { columnKey, direction: "ascending" };
      }
      if (current.direction === "ascending") {
        return { columnKey, direction: "descending" };
      }
      return null;
    });
  }

  if (rows.length === 0) {
    return <p className="py-2 text-xs text-app-text-muted">{emptyText}</p>;
  }

  return (
    <div>
      {showColumnDividersToggle ? (
        <div className="mb-1.5 flex justify-end">
          <DataTableColumnDividerToggle
            value={activeColumnDividerMode}
            onChange={setColumnDividerMode}
          />
        </div>
      ) : null}

      <div className="app-scrollbar overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-app-border text-[11px] font-medium uppercase text-app-text-subtle">
              {columns.map((column) => {
                const activeSort = sort?.columnKey === column.key ? sort : null;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sortable ? (activeSort?.direction ?? "none") : undefined}
                    className={[
                      "whitespace-nowrap px-2 py-1.5 font-medium first:pl-0 last:pr-0",
                      activeColumnDividerMode === "visible"
                        ? "border-l border-app-border/70 first:border-l-0"
                        : "",
                      column.align === "right" ? "text-right" : "text-left",
                      column.className ?? "",
                    ].join(" ")}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={[
                          "inline-flex w-full items-center gap-1 rounded-sm py-0.5 transition hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
                          column.align === "right" ? "justify-end" : "justify-start",
                        ].join(" ")}
                      >
                        <span>{column.label}</span>
                        <MaskedIcon
                          src={
                            activeSort?.direction === "ascending"
                              ? "/icons/utility/up.svg"
                              : activeSort?.direction === "descending"
                                ? "/icons/utility/down.svg"
                                : "/icons/menu/sort.svg"
                          }
                          className={[
                            "h-3 w-3",
                            activeSort ? "text-app-text" : "text-app-text-subtle",
                          ].join(" ")}
                        />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70">
            {sortedRows.map((row) => (
              <tr key={row.key} className="transition-colors hover:bg-app-panel-hover-soft">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      "whitespace-nowrap px-2 py-1.5 first:pl-0 last:pr-0",
                      activeColumnDividerMode === "visible"
                        ? "border-l border-app-border/70 first:border-l-0"
                        : "",
                      column.align === "right"
                        ? "text-right tabular-nums text-app-text"
                        : "text-left text-app-text-muted",
                      column.className ?? "",
                    ].join(" ")}
                  >
                    {row.cells[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
