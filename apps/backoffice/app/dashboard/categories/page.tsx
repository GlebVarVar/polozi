"use client";

import { Button } from "@repo/ui/button";
import { TBody, TD, TH, THead, TR, Table } from "@repo/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CategoryForm } from "../../../components/category-form";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "../../../components/data-state";
import { PageHeader } from "../../../components/page-header";
import { ApiError, api } from "../../../lib/api";
import type { Category } from "../../../lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await api.listCategories());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load categories");
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
  const openEdit = (c: Category) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Question categories shown in the app"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add category
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet. Add your first one." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Name</TH>
              <TH>Icon</TH>
              <TH>Order</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {categories.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs text-muted-foreground">{c.id}</TD>
                <TD className="font-medium">{c.name}</TD>
                <TD>{c.iconName || "—"}</TD>
                <TD className="tabular-nums">{c.orderIndex}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(c)}
                      aria-label={`Delete ${c.name}`}
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

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete category"
        description={
          deleting ? (
            <>
              Delete <strong>{deleting.name}</strong>? All questions in this
              category will also be removed. This cannot be undone.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (deleting) await api.deleteCategory(deleting.id);
        }}
        onConfirmed={load}
      />
    </>
  );
}
