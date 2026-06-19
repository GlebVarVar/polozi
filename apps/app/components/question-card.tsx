"use client";

import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/cn";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { shuffle } from "../lib/format";
import { useSettings } from "../lib/settings";
import type { Answer, Question } from "../lib/types";

export function isTextCorrect(question: Question, text: string): boolean {
  if (!question.correctTextAnswer) return false;
  return (
    text.trim().toLowerCase() ===
    question.correctTextAnswer.trim().toLowerCase()
  );
}

export function isQuestionAnswerCorrect(
  question: Question,
  selectedAnswerId: number | null,
  textAnswer: string,
): boolean {
  if (question.type === "openText") return isTextCorrect(question, textAnswer);
  const ans = question.answers.find((a) => a.id === selectedAnswerId);
  return ans?.isCorrect ?? false;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswerId: number | null;
  textAnswer: string;
  onSelectAnswer: (id: number) => void;
  onChangeText: (value: string) => void;
  /** When true, reveal correct/incorrect styling and explanation. */
  revealed: boolean;
  /** Disable interaction (e.g. after revealing in training). */
  disabled?: boolean;
}

export function QuestionCard({
  question,
  selectedAnswerId,
  textAnswer,
  onSelectAnswer,
  onChangeText,
  revealed,
  disabled,
}: QuestionCardProps) {
  const { settings, t } = useSettings();

  const orderedAnswers = useMemo<Answer[]>(() => {
    const sorted = [...question.answers].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    return settings.shuffleAnswers ? shuffle(sorted) : sorted;
    // Re-shuffle only when question or shuffle setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, settings.shuffleAnswers]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold leading-snug">{question.text}</h2>

      {question.type === "openText" ? (
        <div className="space-y-2">
          <Input
            value={textAnswer}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={t("question.typeAnswer")}
            disabled={disabled}
            className={cn(
              revealed &&
                (isTextCorrect(question, textAnswer)
                  ? "border-success ring-2 ring-success/30"
                  : "border-destructive ring-2 ring-destructive/30"),
            )}
          />
          {revealed && question.correctTextAnswer ? (
            <p className="text-sm text-muted-foreground">
              {t("question.yourAnswer")}:{" "}
              <span className="font-medium text-foreground">
                {question.correctTextAnswer}
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2.5">
          {orderedAnswers.map((answer) => {
            const selected = selectedAnswerId === answer.id;
            const showCorrect = revealed && answer.isCorrect;
            const showWrong = revealed && selected && !answer.isCorrect;
            return (
              <button
                key={answer.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectAnswer(answer.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-default",
                  showCorrect
                    ? "border-success bg-success/10 text-foreground"
                    : showWrong
                      ? "border-destructive bg-destructive/10 text-foreground"
                      : selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    showCorrect
                      ? "border-success bg-success text-success-foreground"
                      : showWrong
                        ? "border-destructive bg-destructive text-destructive-foreground"
                        : selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                  )}
                >
                  {showCorrect ? (
                    <Check className="size-3.5" />
                  ) : showWrong ? (
                    <X className="size-3.5" />
                  ) : null}
                </span>
                <span className="flex-1">{answer.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {revealed && question.explanation ? (
        <div className="rounded-xl border border-border bg-secondary/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("question.explanation")}
          </p>
          <p className="text-sm leading-relaxed">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
