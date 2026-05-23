"use client";

import type { ReactNode } from "react";

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

  const confirmClass =
    tone === "danger"
      ? "bg-red-200 text-red-950 hover:bg-red-100"
      : "bg-slate-100 text-slate-950 hover:bg-slate-200";

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
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "rounded-md px-4 py-2.5 text-sm font-medium transition",
              confirmClass,
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
