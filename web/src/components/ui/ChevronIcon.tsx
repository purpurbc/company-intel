import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

type ChevronIconProps = {
  expanded?: boolean;
  className?: string;
};

/** Shared expand/collapse indicator. The down SVG rotates when content is open. */
export function ChevronIcon({
  expanded = false,
  className = "h-4 w-4",
}: ChevronIconProps) {
  return (
    <MaskedIcon
      src="/icons/utility/down.svg"
      className={[
        className,
        "transition-transform duration-150",
        expanded ? "rotate-180" : "",
      ].join(" ")}
    />
  );
}
