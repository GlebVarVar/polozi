"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { cn } from "@repo/ui/lib/cn";
import {
  CheckCircle2,
  CloudUpload,
  LogOut,
  RefreshCw,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";

export function AccountCard() {
  const { t } = useSettings();
  const { user, status, login, register, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password);
      setPassword("");
    } catch (err) {
      setError((err as Error).message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  // ---- signed in ----
  if (user) {
    const sync =
      status === "syncing"
        ? {
            icon: <RefreshCw className="size-3.5 animate-spin" />,
            text: t("account.syncing"),
            cls: "bg-secondary text-muted-foreground",
          }
        : status === "error"
          ? {
              icon: <TriangleAlert className="size-3.5" />,
              text: t("account.syncError"),
              cls: "bg-destructive/10 text-destructive",
            }
          : {
              icon: <CheckCircle2 className="size-3.5" />,
              text: t("account.synced"),
              cls: "bg-success/10 text-success",
            };

    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary">
              {user.email.charAt(0) || <UserRound className="size-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("account.signedInAs")}
              </p>
              <p className="truncate text-sm font-semibold">{user.email}</p>
              <span
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  sync.cls,
                )}
              >
                {sync.icon}
                {sync.text}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="self-start sm:self-auto"
          >
            <LogOut className="size-4" />
            {t("account.logout")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- signed out: login / register ----
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CloudUpload className="size-5.5" />
          </span>
          <div>
            <p className="text-base font-semibold leading-tight">
              {t("account.title")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("account.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0.5 rounded-xl bg-secondary p-0.5">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              aria-pressed={mode === m}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === m
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "login" ? t("account.login") : t("account.register")}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="account-email">{t("account.email")}</Label>
            <Input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-password">{t("account.password")}</Label>
            <Input
              id="account-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy
              ? t("account.pleaseWait")
              : mode === "login"
                ? t("account.login")
                : t("account.register")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
