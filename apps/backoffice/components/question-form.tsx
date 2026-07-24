"use client";

import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Spinner } from "@repo/ui/spinner";
import { Textarea } from "@repo/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";
import type {
  AnswerInput,
  Category,
  Question,
  QuestionInput,
  QuestionType,
} from "../lib/types";

type FormState = {
  id: string;
  categoryId: string;
  text: string;
  type: QuestionType;
  difficulty: number;
  orderIndex: number;
  explanation: string;
  imageName: string;
  correctTextAnswer: string;
  answers: AnswerInput[];
};

function blankAnswer(orderIndex: number): AnswerInput {
  return { text: "", isCorrect: false, orderIndex };
}

function initialState(
  initial: Question | null,
  categories: Category[],
): FormState {
  if (initial) {
    return {
      id: initial.id,
      categoryId: initial.categoryId,
      text: initial.text,
      type: initial.type,
      difficulty: initial.difficulty,
      orderIndex: initial.orderIndex,
      explanation: initial.explanation ?? "",
      imageName: initial.imageName ?? "",
      correctTextAnswer: initial.correctTextAnswer ?? "",
      answers: initial.answers.map((a) => ({
        text: a.text,
        isCorrect: a.isCorrect,
        orderIndex: a.orderIndex,
      })),
    };
  }
  return {
    id: "",
    categoryId: categories[0]?.id ?? "",
    text: "",
    type: "multipleChoice",
    difficulty: 1,
    orderIndex: 0,
    explanation: "",
    imageName: "",
    correctTextAnswer: "",
    answers: [blankAnswer(0), blankAnswer(1)],
  };
}

export function QuestionForm({
  open,
  onClose,
  initial,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Question | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(() =>
    initialState(null, categories),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(initial, categories));
      setError(null);
    }
  }, [open, initial, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isOpenText = form.type === "openText";

  const updateAnswer = (index: number, patch: Partial<AnswerInput>) =>
    setForm((f) => ({
      ...f,
      answers: f.answers.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));

  const addAnswer = () =>
    setForm((f) => ({
      ...f,
      answers: [...f.answers, blankAnswer(f.answers.length)],
    }));

  const removeAnswer = (index: number) =>
    setForm((f) => ({
      ...f,
      answers: f.answers
        .filter((_, i) => i !== index)
        .map((a, i) => ({ ...a, orderIndex: i })),
    }));

  const validate = (): string | null => {
    if (!form.id.trim()) return "ID is required.";
    if (!form.categoryId) return "Please select a category.";
    if (!form.text.trim()) return "Question text is required.";
    if (isOpenText) {
      if (!form.correctTextAnswer.trim())
        return "A correct text answer is required for open-text questions.";
      return null;
    }
    if (form.answers.length < 2) return "Add at least two answers.";
    if (form.answers.some((a) => !a.text.trim()))
      return "All answers must have text.";
    if (!form.answers.some((a) => a.isCorrect))
      return "Mark at least one answer as correct.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: QuestionInput = {
        id: form.id.trim(),
        categoryId: form.categoryId,
        text: form.text.trim(),
        type: form.type,
        difficulty: form.difficulty,
        orderIndex: form.orderIndex,
        explanation: form.explanation.trim() ? form.explanation.trim() : null,
        imageName: form.imageName.trim() ? form.imageName.trim() : null,
        correctTextAnswer: isOpenText
          ? form.correctTextAnswer.trim()
          : null,
        answers: isOpenText
          ? []
          : form.answers.map((a, i) => ({
              text: a.text.trim(),
              isCorrect: a.isCorrect,
              orderIndex: i,
            })),
      };
      if (isEdit && initial) await api.updateQuestion(initial.id, payload);
      else await api.createQuestion(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save question",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit question" : "Add question"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-id">ID</Label>
            <Input
              id="q-id"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={isEdit}
              required
              placeholder="q_010"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-cat">Category</Label>
            <Select
              id="q-cat"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              {categories.length === 0 ? (
                <option value="">No categories</option>
              ) : null}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-text">Question text</Label>
          <Textarea
            id="q-text"
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-type">Type</Label>
            <Select
              id="q-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as QuestionType)}
            >
              <option value="multipleChoice">Multiple choice</option>
              <option value="imageChoice">Image choice</option>
              <option value="openText">Open text</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-diff">Difficulty</Label>
            <Select
              id="q-diff"
              value={String(form.difficulty)}
              onChange={(e) => set("difficulty", Number(e.target.value))}
            >
              <option value="1">1 — Easy</option>
              <option value="2">2 — Hard</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-order">Order index</Label>
            <Input
              id="q-order"
              type="number"
              value={form.orderIndex}
              onChange={(e) => set("orderIndex", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-image">Image name (optional)</Label>
          <Input
            id="q-image"
            value={form.imageName}
            onChange={(e) => set("imageName", e.target.value)}
            placeholder="sign_stop.png"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-expl">Explanation (optional)</Label>
          <Textarea
            id="q-expl"
            value={form.explanation}
            onChange={(e) => set("explanation", e.target.value)}
          />
        </div>

        {isOpenText ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-correct">Correct text answer</Label>
            <Input
              id="q-correct"
              value={form.correctTextAnswer}
              onChange={(e) => set("correctTextAnswer", e.target.value)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Answers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAnswer}
              >
                <Plus className="size-4" />
                Add answer
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {form.answers.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <Input
                    value={a.text}
                    onChange={(e) => updateAnswer(i, { text: e.target.value })}
                    placeholder={`Answer ${i + 1}`}
                    className="flex-1"
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={a.isCorrect}
                      onChange={(e) =>
                        updateAnswer(i, { isCorrect: e.target.checked })
                      }
                      className="size-4 accent-primary"
                    />
                    Correct
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAnswer(i)}
                    disabled={form.answers.length <= 1}
                    aria-label={`Remove answer ${i + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner className="size-4 text-current" /> : null}
            {isEdit ? "Save changes" : "Create question"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
