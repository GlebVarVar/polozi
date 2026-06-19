"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { ProgressRing } from "@repo/ui/progress-ring";
import { CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../../../components/app-shell";
import {
  isQuestionAnswerCorrect,
  QuestionCard,
} from "../../../components/question-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "../../../components/states";
import { api } from "../../../lib/api";
import { useSettings } from "../../../lib/settings";
import {
  getMistakeQuestionIds,
  recordAttempt,
} from "../../../lib/storage";
import type { Question } from "../../../lib/types";
import { useAsync } from "../../../lib/use-async";

function SessionInner() {
  const { t, settings } = useSettings();
  const params = useSearchParams();
  const mode = params.get("mode");
  const categoryId = params.get("category");
  const isMistakes = mode === "mistakes";

  const { data, loading, error, reload } = useAsync(async () => {
    if (isMistakes) {
      const ids = getMistakeQuestionIds();
      const qs = await Promise.all(
        ids.map((id) => api.question(id).catch(() => null)),
      );
      return qs.filter((q): q is Question => q !== null);
    }
    if (categoryId) return api.questions({ categoryId });
    return api.questions({ limit: 50 });
  }, [isMistakes, categoryId]);

  const [index, setIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const total = data?.length ?? 0;
  const question = data?.[index];

  const reset = useCallback(() => {
    setIndex(0);
    setSelectedAnswerId(null);
    setTextAnswer("");
    setRevealed(false);
    setCorrectCount(0);
    setDone(false);
  }, []);

  const goNext = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setRevealed(false);
    setSelectedAnswerId(null);
    setTextAnswer("");
    setIndex((i) => {
      if (i + 1 >= total) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [total]);

  const check = useCallback(() => {
    if (!question) return;
    const correct = isQuestionAnswerCorrect(
      question,
      selectedAnswerId,
      textAnswer,
    );
    recordAttempt({
      questionId: question.id,
      categoryId: question.categoryId,
      isCorrect: correct,
      date: Date.now(),
    });
    if (correct) setCorrectCount((c) => c + 1);
    setRevealed(true);
    if (settings.autoAdvance) {
      timer.current = setTimeout(goNext, 1400);
    }
  }, [question, selectedAnswerId, textAnswer, settings.autoAdvance, goNext]);

  const canCheck = question
    ? question.type === "openText"
      ? textAnswer.trim().length > 0
      : selectedAnswerId !== null
    : false;

  const title = isMistakes
    ? t("training.mistakes")
    : t("training.title");

  if (loading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState onRetry={reload} />
      </AppShell>
    );
  }

  if (total === 0) {
    return (
      <AppShell>
        <PageHeader title={title} />
        <EmptyState
          icon={<CheckCircle2 className="size-7" />}
          title={isMistakes ? t("training.noMistakes") : t("training.empty")}
        >
          <Link href="/training" className="mt-2">
            <Button variant="outline">{t("common.back")}</Button>
          </Link>
        </EmptyState>
      </AppShell>
    );
  }

  if (done) {
    const pct = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <ProgressRing value={pct} size={140} />
          <div>
            <h1 className="text-2xl font-bold">
              {t("training.sessionComplete")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t("training.result")
                .replace("{correct}", String(correctCount))
                .replace("{total}", String(total))}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <RotateCcw className="size-4" />
              {t("training.restart")}
            </Button>
            <Link href="/training">
              <Button variant="outline">{t("training.finish")}</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!question) {
    return (
      <AppShell>
        <ErrorState onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          href="/training"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("common.back")}
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="text-muted-foreground">
            {index + 1} {t("common.of")} {total}
          </span>
          <span className="text-success">
            {correctCount} {t("question.correct").toLowerCase()}
          </span>
        </div>
      </div>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <QuestionCard
            question={question}
            selectedAnswerId={selectedAnswerId}
            textAnswer={textAnswer}
            onSelectAnswer={(id) => !revealed && setSelectedAnswerId(id)}
            onChangeText={(v) => !revealed && setTextAnswer(v)}
            revealed={revealed}
            disabled={revealed}
          />
        </CardContent>
      </Card>

      <div className="mt-5 flex justify-end">
        {revealed ? (
          <Button onClick={goNext} size="lg">
            {index + 1 >= total ? t("training.finish") : t("exam.next")}
          </Button>
        ) : (
          <Button onClick={check} size="lg" disabled={!canCheck}>
            {t("question.check")}
          </Button>
        )}
      </div>
    </AppShell>
  );
}

export default function TrainingSessionPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <LoadingState />
        </AppShell>
      }
    >
      <SessionInner />
    </Suspense>
  );
}
