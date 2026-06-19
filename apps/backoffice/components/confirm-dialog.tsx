"use client";

import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Spinner } from "@repo/ui/spinner";
import { useState } from "react";
import { ApiError } from "../lib/api";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onConfirmed?: () => void;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onConfirmed,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onConfirmed?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
          {busy ? <Spinner className="size-4 text-current" /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
