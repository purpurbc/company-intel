"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/src/components/ui/Button";
import { ui } from "@/src/lib/uiStyles";

type DialogProps = {
  title: ReactNode;
  children?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  labelledBy: string;
  width?: "sm" | "md" | "lg";
  className?: string;
  contentClassName?: string;
  onClose: () => void;
};

const widthClass = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
} as const;

/** Shared modal shell: overlay, width, padding, typography and action spacing. */
export function Dialog({
  title,
  children,
  eyebrow,
  footer,
  labelledBy,
  width = "md",
  className = "",
  contentClassName = "mt-4",
  onClose,
}: DialogProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={ui.modalOverlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={[ui.modalPanel, widthClass[width], className].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? <p className={ui.eyebrow}>{eyebrow}</p> : null}
            <h2 id={labelledBy} className={[ui.sectionTitle, eyebrow ? "mt-1" : ""].join(" ")}>
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0"
          >
            Stäng
          </Button>
        </div>
        {children ? <div className={contentClassName}>{children}</div> : null}
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
