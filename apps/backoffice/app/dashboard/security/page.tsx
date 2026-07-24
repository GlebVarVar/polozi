"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import {
  Check,
  Copy,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../../components/data-state";
import { PageHeader } from "../../../components/page-header";
import { ApiError, api } from "../../../lib/api";

/** Group a base32 secret into readable 4-char blocks. */
function formatSecret(s: string) {
  return s.replace(/(.{4})/g, "$1 ").trim();
}

function CodeInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={6}
      placeholder="123456"
      className="max-w-40 text-center text-lg tracking-[0.3em]"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
    />
  );
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(
    null,
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { enabled } = await api.twofaStatus();
      setEnabled(enabled);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setSetup(null);
    setCode("");
    setError(null);
    setCopied(false);
  };

  const startSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      setSetup(await api.twofaSetup());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to start setup");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.twofaEnable(code);
      setEnabled(true);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to enable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.twofaDisable(code);
      setEnabled(false);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <PageHeader
        title="Security"
        description="Two-factor authentication for your admin account"
      />

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState message="Failed to load security settings" onRetry={load} />
      ) : enabled ? (
        // ---- enabled: show status + disable ----
        <Card className="max-w-xl">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Two-factor authentication is on</p>
                <p className="text-sm text-muted-foreground">
                  A code from your authenticator app is required at sign-in.
                </p>
              </div>
            </div>

            <form onSubmit={disable} className="space-y-3 border-t border-border pt-5">
              <Label htmlFor="disable-code">
                Enter a current code to turn it off
              </Label>
              <div className="flex items-center gap-3">
                <CodeInput id="disable-code" value={code} onChange={setCode} />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={busy || code.length < 6}
                >
                  {busy ? <Spinner className="size-4 text-current" /> : null}
                  Disable 2FA
                </Button>
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : setup ? (
        // ---- setup in progress ----
        <Card className="max-w-xl">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="font-semibold">Set up your authenticator</p>
              <p className="text-sm text-muted-foreground">
                Add this key to Google Authenticator, 1Password, Authy, etc., then
                enter the generated code to confirm.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Setup key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm tracking-wide">
                  {formatSecret(setup.secret)}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                >
                  {copied ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="break-all text-xs text-muted-foreground">
                Or open this link in an authenticator:{" "}
                <a
                  href={setup.otpauthUrl}
                  className="text-primary hover:underline"
                >
                  {setup.otpauthUrl}
                </a>
              </p>
            </div>

            <form
              onSubmit={confirmEnable}
              className="space-y-3 border-t border-border pt-5"
            >
              <Label htmlFor="enable-code">Verification code</Label>
              <div className="flex items-center gap-3">
                <CodeInput id="enable-code" value={code} onChange={setCode} />
                <Button type="submit" disabled={busy || code.length < 6}>
                  {busy ? <Spinner className="size-4 text-current" /> : null}
                  Enable 2FA
                </Button>
                <Button type="button" variant="ghost" onClick={reset}>
                  Cancel
                </Button>
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : (
        // ---- disabled: offer to enable ----
        <Card className="max-w-xl">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-warning/10 text-warning">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="font-semibold">
                  Two-factor authentication is off
                </p>
                <p className="text-sm text-muted-foreground">
                  Protect this account with a time-based code from an
                  authenticator app.
                </p>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button onClick={startSetup} disabled={busy}>
              {busy ? <Spinner className="size-4 text-current" /> : null}
              <ShieldCheck className="size-4" />
              Enable two-factor authentication
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
