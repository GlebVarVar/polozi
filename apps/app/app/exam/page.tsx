"use client";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { cn } from "@repo/ui/lib/cn";
import { ProgressRing } from "@repo/ui/progress-ring";
import {
  CheckCircle2,
  Clock,
  ListChecks,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/app-shell";
import {
  isQuestionAnswerCorrect,
  QuestionCard,
} from "../../components/question-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "../../components/states";
import { api } from "../../lib/api";
import { formatDuration, shuffle } from "../../lib/format";
import { useSettings } from "../../lib/settings";
import { addExamSession, recordAttempt } from "../../lib/storage";
import type { Question } from "../../lib/types";

const EXAM_SIZE = 40;
const EXAM_SECONDS = 45 * 60;

type Phase = "intro" | "loading" | "active" | "result";

interface AnswerState {
  selectedAnswerId: number | null;
  textAnswer: string;
}

export default function ExamPage() {
  const { t } = useSettings();

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [result, setResult] = useState<{
    correct: number;
    total: number;
    passed: boolean;
    timeTaken: number;
  } | null>(null);

  const startedAt = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  }, []);

  const submit = useCallback(() => {
    stopTimer();
    let correct = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      const ok = isQuestionAnswerCorrect(
        q,
        a?.selectedAnswerId ?? null,
        a?.textAnswer ?? "",
      );
      if (ok) correct++;
      recordAttempt({
        questionId: q.id,
        categoryId: q.categoryId,
        isCorrect: ok,
        date: Date.now(),
      });
    });
    const total = questions.length;
    const passed =
      total === EXAM_SIZE ? correct >= 36 : total > 0 && correct / total >= 0.9;
    const timeTaken = Math.min(
      EXAM_SECONDS,
      Math.round((Date.now() - startedAt.current) / 1000),
    );
    addExamSession({
      date: Date.now(),
      totalQuestions: total,
      correctAnswers: correct,
      timeTakenSeconds: timeTaken,
      passed,
    });
    setResult({ correct, total, passed, timeTaken });
    setPhase("result");
  }, [answers, questions, stopTimer]);

  const submitRef = useRef(submit);
  submitRef.current = submit;

  const start = useCallback(async () => {
    setPhase("loading");
    setLoadError(false);
    try {
      const pool = await api.questions({ limit: 200 });
      const picked = shuffle(pool).slice(0, EXAM_SIZE);
      if (picked.length === 0) {
        setQuestions([]);
        setPhase("active");
        return;
      }
      setQuestions(picked);
      setAnswers(
        picked.map(() => ({ selectedAnswerId: null, textAnswer: "" })),
      );
      setIndex(0);
      setSecondsLeft(EXAM_SECONDS);
      setResult(null);
      startedAt.current = Date.now();
      setPhase("active");
    } catch {
      setLoadError(true);
      setPhase("intro");
    }
  }, []);

  useEffect(() => {
    if (phase !== "active" || questions.length === 0) return;
    tick.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          submitRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [phase, questions.length, stopTimer]);

  const answeredCount = useMemo(
    () =>
      answers.filter(
        (a) => a.selectedAnswerId !== null || a.textAnswer.trim().length > 0,
      ).length,
    [answers],
  );

  const setAnswer = useCallback(
    (patch: Partial<AnswerState>) => {
      setAnswers((prev) => {
        const next = [...prev];
        const cur = next[index] ?? {
          selectedAnswerId: null,
          textAnswer: "",
        };
        next[index] = { ...cur, ...patch };
        return next;
      });
    },
    [index],
  );

  // ---- Intro ----
  if (phase === "intro") {
    return (
      <AppShell>
        <PageHeader title={t("exam.title")} subtitle={t("exam.info")} />
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {t("exam.rulesTitle")}
            </h2>
            <ul className="space-y-3">
              {[
                t("exam.rule1"),
                t("exam.rule2"),
                t("exam.rule3"),
                t("exam.rule4"),
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            {loadError ? (
              <p className="mt-4 text-sm text-destructive">
                {t("common.error")}
              </p>
            ) : null}
            <Button onClick={start} size="lg" className="mt-6 w-full">
              {t("exam.start")}
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (phase === "loading") {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  // ---- Result ----
  if (phase === "result" && result) {
    const pct = result.total
      ? Math.round((result.correct / result.total) * 100)
      : 0;
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <ProgressRing value={pct} size={160} strokeWidth={12} />
          <div>
            <h1 className="text-2xl font-bold">
              {result.passed ? t("exam.passed") : t("exam.failed")}
            </h1>
            <Badge
              variant={result.passed ? "success" : "destructive"}
              className="mt-2"
            >
              {result.passed ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              {result.correct} / {result.total}
            </Badge>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-muted-foreground">{t("exam.score")}</p>
              <p className="text-lg font-bold">
                {result.correct} / {result.total}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("exam.time")}</p>
              <p className="text-lg font-bold">
                {formatDuration(result.timeTaken)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={start}>
              <RotateCcw className="size-4" />
              {t("exam.retry")}
            </Button>
            <Link href="/">
              <Button variant="outline">{t("exam.backHome")}</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ---- Active ----
  if (questions.length === 0) {
    return (
      <AppShell>
        <PageHeader title={t("exam.title")} />
        <EmptyState
          icon={<ListChecks className="size-7" />}
          title={t("exam.empty")}
        >
          <Button variant="outline" className="mt-2" onClick={() => setPhase("intro")}>
            {t("common.back")}
          </Button>
        </EmptyState>
      </AppShell>
    );
  }

  const question = questions[index];
  const current = answers[index] ?? {
    selectedAnswerId: null,
    textAnswer: "",
  };
  const low = secondsLeft <= 60;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          {t("exam.question")} {index + 1} {t("common.of")} {questions.length}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums",
            low
              ? "bg-destructive/15 text-destructive"
              : "bg-secondary text-foreground",
          )}
        >
          <Clock className="size-4" />
          {formatDuration(secondsLeft)}
        </span>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          {question ? (
            <QuestionCard
              question={question}
              selectedAnswerId={current.selectedAnswerId}
              textAnswer={current.textAnswer}
              onSelectAnswer={(id) => setAnswer({ selectedAnswerId: id })}
              onChangeText={(v) => setAnswer({ textAnswer: v })}
              revealed={false}
            />
          ) : (
            <ErrorState />
          )}
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          {t("exam.prev")}
        </Button>
        {index + 1 < questions.length ? (
          <Button onClick={() => setIndex((i) => i + 1)}>
            {t("exam.next")}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirmOpen(true)}>
            {t("exam.submit")}
          </Button>
        )}
      </div>

      {/* Navigator */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("exam.navigator")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {answeredCount} / {questions.length} {t("exam.answered")}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
          {questions.map((q, i) => {
            const a = answers[i];
            const isAnswered =
              !!a &&
              (a.selectedAnswerId !== null || a.textAnswer.trim().length > 0);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                  i === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : isAnswered
                      ? "border-success/40 bg-success/15 text-success"
                      : "border-border bg-card text-muted-foreground hover:bg-accent",
                )}
                aria-label={`${t("exam.question")} ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => setConfirmOpen(true)}
        >
          {t("exam.submit")}
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("exam.submitConfirm")}
      >
        <p className="mb-5 text-sm text-muted-foreground">
          {answeredCount} / {questions.length} {t("exam.answered")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              submit();
            }}
          >
            {t("exam.submit")}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
