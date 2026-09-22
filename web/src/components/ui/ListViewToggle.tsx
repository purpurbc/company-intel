"use client";

import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ToggleButton } from "@/src/components/ui/ToggleButton";

export type ListViewMode = "card" | "compact";

type ListViewToggleProps = {
  value: ListViewMode;
  onChange: (value: ListViewMode) => void;
  ariaLabel?: string;
  className?: string;
};

/** Shared, compact switch between card and dense list presentation. */
export function ListViewToggle({
  value,
  onChange,
  ariaLabel = "Visningsläge",
  className = "",
}: ListViewToggleProps) {
  return (
    <ToggleButton<ListViewMode>
      value={value}
      onChange={onChange}
      iconOnly
      ariaLabel={ariaLabel}
      className={className}
      options={[
        {
          value: "compact",
          label: "Kompakt lista",
          icon: <MaskedIcon src="/icons/utility/compact_list.svg" className="h-4 w-4" />,
        },
        {
          value: "card",
          label: "Kort",
          icon: <MaskedIcon src="/icons/utility/tiles.svg" className="h-4 w-4" />,
        },
      ]}
    />
  );
}
