"use client";

import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/cn";
import { ProgressRing } from "@repo/ui/progress-ring";
import { AlertCircle, BarChart3, CheckCircle2, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { EmptyState, LoadingState, PageHeader } from "../../components/states";
import { api } from "../../lib/api";
import { formatDate, formatDuration } from "../../lib/format";
import { useSettings } from "../../lib/settings";
import {
  getExamSessions,
  getStats,
  type ExamSessionRecord,
  type Stats,
} from "../../lib/storage";
import type { Category } from "../../lib/types";
import { useAsync } from "../../lib/use-async";

export default function StatsPage() {
  const { t, settings } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [exams, setExams] = useState<ExamSessionRecord[]>([]);

  useEffect(() => {
    setStats(getStats());
    setExams(getExamSessions());
  }, []);

  const { data: categories, loading } = useAsync(() => api.categories(), []);

  if (!stats || loading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  const hasData = stats.total > 0 || exams.length > 0;
  const catName = (id: string): string =>
    (categories ?? []).find((c: Category) => c.id === id)?.name ?? id;

  return (
    <AppShell>
      <PageHeader title={t("stats.title")} />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="size-7" />}
          title={t("stats.noData")}
        />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-3 py-2">
            <ProgressRing value={stats.accuracy} size={150} strokeWidth={12} />
            <p className="text-sm text-muted-foreground">{t("stats.overall")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatTile
              icon={Target}
              tone="primary"
              label={t("stats.answered")}
              value={stats.total}
            />
            <StatTile
              icon={CheckCircle2}
              tone="success"
              label={t("stats.correct")}
              value={stats.correct}
            />
            <StatTile
              icon={AlertCircle}
              tone="warning"
              label={t("stats.mistakes")}
              value={stats.mistakes}
            />
          </div>

          {Object.keys(stats.perCategory).length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("stats.byCategory")}
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.perCategory).map(([id, c]) => {
                  const pct = c.total
                    ? Math.round((c.correct / c.total) * 100)
                    : 0;
                  return (
                    <div key={id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{catName(id)}</span>
                        <span className="text-muted-foreground">
                          {c.correct}/{c.total} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {exams.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("stats.examHistory")}
              </h2>
              <div className="space-y-2.5">
                {exams.map((exam, i) => (
                  <Card key={`${exam.date}-${i}`}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(exam.date, settings.language)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(exam.timeTakenSeconds)}{" "}
                          {t("common.minutes")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums">
                          {exam.correctAnswers}/{exam.totalQuestions}
                        </span>
                        <Badge
                          variant={exam.passed ? "success" : "destructive"}
                        >
                          {exam.passed ? t("exam.passed") : t("exam.failed")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  tone: "primary" | "success" | "warning";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  }[tone];
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1.5 p-4 text-center">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            toneCls,
          )}
        >
          <Icon className="size-4" />
        </span>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
