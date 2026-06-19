"use client";

import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const { authed, ready, login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && authed) router.replace("/dashboard");
  }, [ready, authed, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "Invalid username or password"
            : err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready || authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            P!
          </span>
          <CardTitle className="text-xl">Položi! Backoffice</CardTitle>
          <CardDescription>Sign in to manage the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Spinner className="size-4 text-current" /> : null}
              Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo: admin / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
