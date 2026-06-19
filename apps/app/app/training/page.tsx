"use client";

import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import { ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell";
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from "../../components/states";
import { api } from "../../lib/api";
import { useSettings } from "../../lib/settings";
import { getMistakeQuestionIds } from "../../lib/storage";
import type { Category } from "../../lib/types";
import { useAsync } from "../../lib/use-async";

export default function TrainingPage() {
  const { t } = useSettings();
  const [mistakeCount, setMistakeCount] = useState(0);

  useEffect(() => {
    setMistakeCount(getMistakeQuestionIds().length);
  }, []);

  const { data, loading, error, reload } = useAsync(async () => {
    const categories = await api.categories();
    const counts = await Promise.all(
      categories.map((c) =>
        api.questions({ categoryId: c.id }).then((q) => q.length),
      ),
    );
    return { categories, counts };
  }, []);

  return (
    <AppShell>
      <PageHeader title={t("training.title")} subtitle={t("training.subtitle")} />

      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="grid gap-3">
          {data.categories
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((category: Category, i) => {
              const count = data.counts[i] ?? 0;
              return (
                <Link
                  key={category.id}
                  href={`/training/session?category=${encodeURIComponent(category.id)}`}
                  className="group block"
                >
                  <Card className="transition-colors group-hover:border-primary/50 group-hover:bg-accent">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {count} {t("training.questions")}
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

          <MistakesCard count={mistakeCount} />
        </div>
      )}
    </AppShell>
  );
}

function MistakesCard({ count }: { count: number }) {
  const { t } = useSettings();
  const disabled = count === 0;

  const inner = (
    <Card
      className={
        disabled
          ? "opacity-60"
          : "transition-colors group-hover:border-primary/50 group-hover:bg-accent"
      }
    >
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
          <Target className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("training.mistakes")}</p>
          <p className="text-sm text-muted-foreground">
            {disabled
              ? t("training.noMistakes")
              : `${count} ${t("training.questions")}`}
          </p>
        </div>
        {!disabled ? <Badge variant="warning">{count}</Badge> : null}
      </CardContent>
    </Card>
  );

  if (disabled) return inner;
  return (
    <Link href="/training/session?mode=mistakes" className="group block">
      {inner}
    </Link>
  );
}
