"use client";

import { Button } from "@repo/ui/button";
import { TBody, TD, TH, THead, TR, Table } from "@repo/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "../../../components/data-state";
import { PageHeader } from "../../../components/page-header";
import { SchoolForm } from "../../../components/school-form";
import { ApiError, api } from "../../../lib/api";
import type { School } from "../../../lib/types";

const rsd = new Intl.NumberFormat("sr-RS");

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [deleting, setDeleting] = useState<School | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSchools(await api.listSchools());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s: School) => {
    setEditing(s);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Driving schools"
        description="Manage partner driving schools"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add school
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : schools.length === 0 ? (
        <EmptyState message="No schools yet. Add your first one." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>City</TH>
              <TH>Phone</TH>
              <TH>Price range (RSD)</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {schools.map((s) => (
              <TR key={s.id}>
                <TD>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.id}</div>
                </TD>
                <TD>{s.city}</TD>
                <TD className="whitespace-nowrap">{s.phone || "—"}</TD>
                <TD className="whitespace-nowrap tabular-nums">
                  {rsd.format(s.priceFrom)} – {rsd.format(s.priceTo)}
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(s)}
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(s)}
                      aria-label={`Delete ${s.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <SchoolForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete school"
        description={
          deleting ? (
            <>
              Delete <strong>{deleting.name}</strong>? This cannot be undone.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (deleting) await api.deleteSchool(deleting.id);
        }}
        onConfirmed={load}
      />
    </>
  );
}
