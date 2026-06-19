"use client";

import { Spinner } from "@repo/ui/spinner";
import { AlertCircle, Inbox } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-muted-foreground">
      <Spinner className="size-6" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 py-16 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <span className="text-sm text-destructive">{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-muted-foreground">
      <Inbox className="size-6" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
