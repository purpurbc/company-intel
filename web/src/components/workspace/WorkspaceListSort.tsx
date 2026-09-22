"use client";

import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

export type WorkspaceListSortValue = "name_asc" | "name_desc" | "newest";

type WorkspaceListSortProps = {
  value: WorkspaceListSortValue;
  onChange: (value: WorkspaceListSortValue) => void;
};

const OPTIONS: ReadonlyArray<{
  value: WorkspaceListSortValue;
  label: string;
}> = [
  { value: "name_asc", label: "Namn A–Ö" },
  { value: "name_desc", label: "Namn Ö–A" },
  { value: "newest", label: "Senast tillagda" },
];

const swedishNameCollator = new Intl.Collator("sv-SE", {
  sensitivity: "base",
  numeric: true,
});

function timestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Shared, non-mutating sort for every list in the sales workspace. */
export function sortWorkspaceItems<T>(
  items: readonly T[],
  value: WorkspaceListSortValue,
  getName: (item: T) => string | null | undefined,
  getCreatedAt: (item: T) => string | null | undefined,
) {
  return [...items].sort((left, right) => {
    if (value === "newest") {
      return timestamp(getCreatedAt(right)) - timestamp(getCreatedAt(left));
    }

    const comparison = swedishNameCollator.compare(
      getName(left)?.trim() || "",
      getName(right)?.trim() || "",
    );
    return value === "name_desc" ? -comparison : comparison;
  });
}

/** Icon-only sort control kept the same height as workspace view controls. */
export function WorkspaceListSort({
  value,
  onChange,
}: WorkspaceListSortProps) {
  return (
    <DropdownMenu
      label="Sortera lista"
      icon={<MaskedIcon src="/icons/menu/sort.svg" className="h-4 w-4" />}
      triggerVariant="ghost"
      triggerClassName="!h-7 !w-7 !min-w-7 !p-0 bg-app-panel-soft hover:bg-app-panel-hover-soft"
      items={OPTIONS.map((option) => ({
        key: option.value,
        label: option.label,
        active: value === option.value,
        onSelect: () => onChange(option.value),
      }))}
    />
  );
}
