"use client";

import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { Dialog } from "@/src/components/ui/Dialog";

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
    <Dialog
      title={title}
      labelledBy="confirm-dialog-title"
      width="sm"
      onClose={onCancel}
      contentClassName="mt-2"
      footer={
        <>
          <Button type="button" onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            variant={tone === "danger" ? "delete" : "accept"}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div>
        {description ? (
          <p className="text-sm text-app-text-muted">{description}</p>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </Dialog>
  );
}
