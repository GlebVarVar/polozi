"use client";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@repo/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "../../../components/data-state";
import { PageHeader } from "../../../components/page-header";
import { QuestionForm } from "../../../components/question-form";
import { ApiError, api } from "../../../lib/api";
import type { Category, Question, QuestionType } from "../../../lib/types";

const TYPE_LABEL: Record<QuestionType, string> = {
  multipleChoice: "Multiple choice",
  imageChoice: "Image choice",
  openText: "Open text",
};

function truncate(text: string, n = 70) {
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

  const loadQuestions = useCallback(async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      setQuestions(await api.listQuestions(categoryId || undefined));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => {
        /* category filter is optional; ignore */
      });
  }, []);

  useEffect(() => {
    loadQuestions(filter);
  }, [filter, loadQuestions]);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (q: Question) => {
    setEditing(q);
    setFormOpen(true);
  };

  const reload = () => loadQuestions(filter);

  return (
    <>
      <PageHeader
        title="Questions"
        description="Manage exam questions and answers"
        action={
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="size-4" />
            Add question
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Label htmlFor="q-filter" className="text-muted-foreground">
          Category
        </Label>
        <Select
          id="q-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-56"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : questions.length === 0 ? (
        <EmptyState message="No questions match this filter." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Text</TH>
              <TH>Category</TH>
              <TH>Type</TH>
              <TH>Difficulty</TH>
              <TH>Answers</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {questions.map((q) => (
              <TR key={q.id}>
                <TD className="font-mono text-xs text-muted-foreground">
                  {q.id}
                </TD>
                <TD className="max-w-xs">{truncate(q.text)}</TD>
                <TD className="whitespace-nowrap">
                  {categoryName(q.categoryId)}
                </TD>
                <TD>
                  <Badge variant="secondary">{TYPE_LABEL[q.type]}</Badge>
                </TD>
                <TD className="tabular-nums">{q.difficulty}</TD>
                <TD className="tabular-nums">
                  {q.type === "openText" ? "—" : q.answers.length}
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(q)}
                      aria-label={`Edit ${q.id}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(q)}
                      aria-label={`Delete ${q.id}`}
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

      <QuestionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        categories={categories}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete question"
        description={
          deleting ? (
            <>
              Delete question <strong>{deleting.id}</strong>? This cannot be
              undone.
            </>
          ) : null
        }
        onConfirm={async () => {
          if (deleting) await api.deleteQuestion(deleting.id);
        }}
        onConfirmed={reload}
      />
    </>
  );
}
