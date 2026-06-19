"use client";

import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import { useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";
import type { School, SchoolInput } from "../lib/types";

function emptySchool(): SchoolInput {
  return {
    id: "",
    name: "",
    city: "",
    address: "",
    phone: "",
    priceFrom: 0,
    priceTo: 0,
    website: null,
    googleMapsURL: null,
  };
}

export function SchoolForm({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: School | null;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<SchoolInput>(emptySchool());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : emptySchool());
      setError(null);
    }
  }, [open, initial]);

  const set = <K extends keyof SchoolInput>(key: K, value: SchoolInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: SchoolInput = {
        ...form,
        website: form.website?.trim() ? form.website.trim() : null,
        googleMapsURL: form.googleMapsURL?.trim()
          ? form.googleMapsURL.trim()
          : null,
      };
      if (isEdit && initial) await api.updateSchool(initial.id, payload);
      else await api.createSchool(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save school");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit school" : "Add school"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID" htmlFor="s-id">
            <Input
              id="s-id"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={isEdit}
              required
              placeholder="novi_put_ns"
            />
          </Field>
          <Field label="Name" htmlFor="s-name">
            <Input
              id="s-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </Field>
          <Field label="City" htmlFor="s-city">
            <Input
              id="s-city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone" htmlFor="s-phone">
            <Input
              id="s-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Address" htmlFor="s-address" className="sm:col-span-2">
            <Input
              id="s-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Price from (RSD)" htmlFor="s-from">
            <Input
              id="s-from"
              type="number"
              min={0}
              value={form.priceFrom}
              onChange={(e) => set("priceFrom", Number(e.target.value))}
            />
          </Field>
          <Field label="Price to (RSD)" htmlFor="s-to">
            <Input
              id="s-to"
              type="number"
              min={0}
              value={form.priceTo}
              onChange={(e) => set("priceTo", Number(e.target.value))}
            />
          </Field>
          <Field label="Website" htmlFor="s-web">
            <Input
              id="s-web"
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Google Maps URL" htmlFor="s-maps">
            <Input
              id="s-maps"
              value={form.googleMapsURL ?? ""}
              onChange={(e) => set("googleMapsURL", e.target.value)}
              placeholder="https://maps.google.com/…"
            />
          </Field>
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
            {isEdit ? "Save changes" : "Create school"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
