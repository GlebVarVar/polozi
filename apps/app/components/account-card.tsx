"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { CheckCircle2, LogOut, RefreshCw, TriangleAlert } from "lucide-react";
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

  // --- signed in ---
  if (user) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("account.signedInAs")}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              {t("account.logout")}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {status === "syncing" ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                {t("account.syncing")}
              </>
            ) : status === "error" ? (
              <>
                <TriangleAlert className="size-3.5 text-destructive" />
                {t("account.syncError")}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-success" />
                {t("account.synced")}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- signed out: login / register form ---
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium">{t("account.title")}</p>
          <p className="text-sm text-muted-foreground">
            {t("account.subtitle")}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
              aria-pressed={mode === m}
            >
              {m === "login" ? t("account.login") : t("account.register")}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
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
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
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
