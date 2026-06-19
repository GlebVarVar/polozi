"use client";

import { Card, CardContent } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/cn";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  type LucideIcon,
  Target,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { useSettings } from "../lib/settings";
import {
  getLatestExam,
  getStats,
  type ExamSessionRecord,
  type Stats,
} from "../lib/storage";

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "primary" | "success" | "destructive" | "warning";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            toneCls,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-accent">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastExam, setLastExam] = useState<ExamSessionRecord | null>(null);

  useEffect(() => {
    setStats(getStats());
    setLastExam(getLatestExam() ?? null);
  }, []);

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("home.welcome")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("home.subtitle")}</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("home.overview")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={Target}
            tone="primary"
            label={t("stats.answered")}
            value={String(stats?.total ?? 0)}
          />
          <StatTile
            icon={CheckCircle2}
            tone="success"
            label={t("stats.correct")}
            value={String(stats?.correct ?? 0)}
          />
          <StatTile
            icon={AlertCircle}
            tone="warning"
            label={t("stats.mistakes")}
            value={String(stats?.mistakes ?? 0)}
          />
          {lastExam ? (
            <StatTile
              icon={lastExam.passed ? CheckCircle2 : XCircle}
              tone={lastExam.passed ? "success" : "destructive"}
              label={t("home.lastExam")}
              value={`${lastExam.correctAnswers}/${lastExam.totalQuestions}`}
            />
          ) : (
            <StatTile
              icon={ClipboardCheck}
              tone="primary"
              label={t("home.lastExam")}
              value={t("home.noExamYet")}
            />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("home.quickActions")}
        </h2>
        <div className="grid gap-3">
          <ActionCard
            href="/exam"
            icon={ClipboardCheck}
            title={t("home.startExam")}
            desc={t("home.startExamDesc")}
          />
          <ActionCard
            href="/training"
            icon={GraduationCap}
            title={t("home.practice")}
            desc={t("home.practiceDesc")}
          />
          <ActionCard
            href="/training/session?mode=mistakes"
            icon={Target}
            title={t("home.mistakes")}
            desc={t("home.mistakesDesc")}
          />
        </div>
      </section>
    </AppShell>
  );
}
