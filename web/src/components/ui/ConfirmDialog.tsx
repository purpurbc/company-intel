"use client";

import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bekräfta",
  cancelLabel = "Avbryt",
  tone = "default",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-xl"
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-slate-50"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            variant={tone === "danger" ? "delete" : "accept"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
