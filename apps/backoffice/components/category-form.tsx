"use client";

import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import { useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";
import type { Category } from "../lib/types";

function emptyCategory(): Category {
  return { id: "", name: "", iconName: "", orderIndex: 0 };
}

export function CategoryForm({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Category | null;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Category>(emptyCategory());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : emptyCategory());
      setError(null);
    }
  }, [open, initial]);

  const set = <K extends keyof Category>(key: K, value: Category[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isEdit && initial) await api.updateCategory(initial.id, form);
      else await api.createCategory(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save category",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit category" : "Add category"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-id">ID</Label>
          <Input
            id="c-id"
            value={form.id}
            onChange={(e) => set("id", e.target.value)}
            disabled={isEdit}
            required
            placeholder="cat_signs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-icon">Icon name</Label>
          <Input
            id="c-icon"
            value={form.iconName}
            onChange={(e) => set("iconName", e.target.value)}
            placeholder="sign"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-order">Order index</Label>
          <Input
            id="c-order"
            type="number"
            value={form.orderIndex}
            onChange={(e) => set("orderIndex", Number(e.target.value))}
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner className="size-4 text-current" /> : null}
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
