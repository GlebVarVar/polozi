"use client";

// Local-only persistence (no account, mirrors the offline mobile app).

export interface Attempt {
  questionId: string;
  categoryId: string;
  isCorrect: boolean;
  date: number;
}

export interface ExamSessionRecord {
  date: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds: number;
  passed: boolean;
}

const ATTEMPTS_KEY = "polozi.attempts";
const EXAMS_KEY = "polozi.exams";

// --- change notifications (used by the auth layer to sync to the server) ---

const listeners = new Set<() => void>();

/** Subscribe to any local progress change. Returns an unsubscribe function. */
export function subscribeProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyProgressChange() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore listener errors */
    }
  }
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAttempts(): Attempt[] {
  return read<Attempt[]>(ATTEMPTS_KEY, []);
}

export function recordAttempt(a: Attempt) {
  const all = getAttempts();
  all.push(a);
  write(ATTEMPTS_KEY, all);
  notifyProgressChange();
}

/** Questions whose latest attempt was wrong. */
export function getMistakeQuestionIds(): string[] {
  const latest = new Map<string, Attempt>();
  for (const a of getAttempts()) {
    const prev = latest.get(a.questionId);
    if (!prev || a.date >= prev.date) latest.set(a.questionId, a);
  }
  return [...latest.values()].filter((a) => !a.isCorrect).map((a) => a.questionId);
}

export interface Stats {
  total: number;
  correct: number;
  accuracy: number;
  mistakes: number;
  perCategory: Record<string, { total: number; correct: number }>;
}

export function getStats(): Stats {
  const attempts = getAttempts();
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const perCategory: Stats["perCategory"] = {};
  for (const a of attempts) {
    const c = (perCategory[a.categoryId] ??= { total: 0, correct: 0 });
    c.total++;
    if (a.isCorrect) c.correct++;
  }
  return {
    total,
    correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    mistakes: getMistakeQuestionIds().length,
    perCategory,
  };
}

export function getExamSessions(): ExamSessionRecord[] {
  return read<ExamSessionRecord[]>(EXAMS_KEY, []).sort((a, b) => b.date - a.date);
}

export function addExamSession(s: ExamSessionRecord) {
  const all = read<ExamSessionRecord[]>(EXAMS_KEY, []);
  all.push(s);
  write(EXAMS_KEY, all);
  notifyProgressChange();
}

export function getLatestExam(): ExamSessionRecord | undefined {
  return getExamSessions()[0];
}

export function clearProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(EXAMS_KEY);
  notifyProgressChange();
}

// --- server-sync helpers (whole progress state as one blob) ---

export interface ProgressBlob {
  attempts: Attempt[];
  exams: ExamSessionRecord[];
}

export function getProgressBlob(): ProgressBlob {
  return { attempts: getAttempts(), exams: getExamSessions() };
}

/** Merge two progress blobs, de-duplicating events. Append-only, so a union is safe. */
export function mergeProgressBlobs(
  a: ProgressBlob,
  b: ProgressBlob,
): ProgressBlob {
  const attemptKey = (x: Attempt) =>
    `${x.questionId}|${x.date}|${x.isCorrect ? 1 : 0}`;
  const examKey = (x: ExamSessionRecord) =>
    `${x.date}|${x.correctAnswers}|${x.totalQuestions}`;

  const attempts = new Map<string, Attempt>();
  for (const x of [...a.attempts, ...b.attempts]) attempts.set(attemptKey(x), x);
  const exams = new Map<string, ExamSessionRecord>();
  for (const x of [...a.exams, ...b.exams]) exams.set(examKey(x), x);

  return {
    attempts: [...attempts.values()].sort((x, y) => x.date - y.date),
    exams: [...exams.values()].sort((x, y) => y.date - x.date),
  };
}

/** Overwrite local progress with the given blob (used after a server merge). */
export function replaceProgress(blob: ProgressBlob) {
  if (typeof window === "undefined") return;
  write(ATTEMPTS_KEY, blob.attempts ?? []);
  write(EXAMS_KEY, blob.exams ?? []);
  notifyProgressChange();
}
