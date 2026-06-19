"use client";

import { Button } from "@repo/ui/button";
import { Spinner } from "@repo/ui/spinner";
import type { ReactNode } from "react";
import { useSettings } from "../lib/settings";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="size-8" />
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-muted-foreground">{t("common.error")}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {t("exam.retry")}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon ? (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
