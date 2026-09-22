"use client";

import { useEffect, useState } from "react";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { buttonClassName } from "@/src/components/ui/Button";

type CopyToClipboardButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
};

export function CopyToClipboardButton({
  value,
  label = "Kopiera",
  copiedLabel = "Kopierad!",
  ariaLabel = "Kopiera till urklipp",
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const tooltip = copied ? copiedLabel : label;

  return (
    <span className="group/copy relative inline-flex shrink-0">
      <button
        type="button"
        onClick={copy}
        onPointerUp={(event) => event.currentTarget.blur()}
        className={buttonClassName({
          variant: "ghost",
          size: "icon",
          className: "h-7 w-7 p-0 text-app-text-subtle hover:text-app-text",
        })}
        aria-label={copied ? copiedLabel : ariaLabel}
      >
        <MaskedIcon
          src="/icons/utility/copy-clipboard.svg"
          className="h-4 w-4"
        />
      </button>

      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-app-text px-2 py-1 text-[11px] font-medium leading-none text-app-bg opacity-0 shadow-sm transition-opacity group-hover/copy:opacity-100 group-focus-within/copy:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}
