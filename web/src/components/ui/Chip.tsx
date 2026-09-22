import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";
import { statusToneClass, type StatusTone } from "@/src/lib/statusTone";

type ChipContentProps = {
  children: ReactNode;
  className?: string;
};

/** Static, wrapping metadata. Use FilterChip for interactive choices. */
export function InfoChip({ children, className = "", ...props }: ChipContentProps & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={[ui.badge, className].join(" ")}>
      {children}
    </span>
  );
}

/** Compact numeric/status count used beside headings. */
export function CountChip({ children, className = "", ...props }: ChipContentProps & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={[ui.countChip, className].join(" ")}>
      {children}
    </span>
  );
}

/** Semantic, non-interactive status. Colors are shared across every theme. */
export function StatusChip({
  children,
  tone = "neutral",
  className = "",
  ...props
}: ChipContentProps & HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return (
    <span
      {...props}
      className={[
        "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
        statusToneClass(tone),
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

/** Shared selectable filter chip with consistent selected and disabled states. */
export function FilterChip({ selected = false, className = "", children, type = "button", ...props }: FilterChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={[ui.chip, selected ? ui.chipSelected : "", className].join(" ")}
    >
      {children}
    </button>
  );
}
