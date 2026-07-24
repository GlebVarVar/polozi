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
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const { authed, ready, login, verify2fa } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<"credentials" | "twofa">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && authed) router.replace("/dashboard");
  }, [ready, authed, router]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { requires2fa } = await login(username, password);
      if (requires2fa) {
        setPhase("twofa");
        setCode("");
      } else {
        router.replace("/dashboard");
      }
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

  const handleTwoFa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verify2fa(code);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid or expired code. Try again."
          : "Verification failed. Please try again.",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <Card className="relative w-full max-w-sm shadow-lg">
        {phase === "credentials" ? (
          <>
            <CardHeader className="items-center pb-2 text-center">
              <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
                P!
              </span>
              <CardTitle className="text-xl">Položi! Backoffice</CardTitle>
              <CardDescription>Sign in to manage the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
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
          </>
        ) : (
          <>
            <CardHeader className="items-center pb-2 text-center">
              <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <ShieldCheck className="size-7" />
              </span>
              <CardTitle className="text-xl">Two-factor authentication</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTwoFa} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="code">Authentication code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-lg tracking-[0.4em]"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    autoFocus
                  />
                </div>
                {error ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || code.length < 6}
                >
                  {busy ? <Spinner className="size-4 text-current" /> : null}
                  Verify
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("credentials");
                    setError(null);
                    setPassword("");
                  }}
                  className="text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
