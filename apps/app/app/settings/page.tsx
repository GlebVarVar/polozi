"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { cn } from "@repo/ui/lib/cn";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { AccountCard } from "../../components/account-card";
import { AppShell } from "../../components/app-shell";
import { PageHeader } from "../../components/states";
import { localeNames, locales } from "../../lib/i18n";
import {
  type FontSize,
  type Theme,
  useSettings,
} from "../../lib/settings";
import { clearProgress } from "../../lib/storage";

function SegRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { settings, update, t } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "system", label: t("settings.theme.system") },
    { value: "light", label: t("settings.theme.light") },
    { value: "dark", label: t("settings.theme.dark") },
  ];
  const fontOptions: { value: FontSize; label: string }[] = [
    { value: "small", label: t("settings.fontSize.small") },
    { value: "medium", label: t("settings.fontSize.medium") },
    { value: "large", label: t("settings.fontSize.large") },
  ];

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} />

      <div className="space-y-4">
        <AccountCard />

        <Card>
          <CardContent className="space-y-6 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">
                {t("settings.language")}
              </span>
              <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => update({ language: loc })}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      settings.language === loc
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={settings.language === loc}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>
            </div>

            <SegRow
              label={t("settings.theme")}
              value={settings.theme}
              options={themeOptions}
              onChange={(v) => update({ theme: v })}
            />

            <SegRow
              label={t("settings.fontSize")}
              value={settings.fontSize}
              options={fontOptions}
              onChange={(v) => update({ fontSize: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            <Toggle
              label={t("settings.autoAdvance")}
              checked={settings.autoAdvance}
              onChange={(v) => update({ autoAdvance: v })}
            />
            <Toggle
              label={t("settings.shuffle")}
              checked={settings.shuffleAnswers}
              onChange={(v) => update({ shuffleAnswers: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("settings.reset")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("settings.resetConfirm")}
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clearProgress();
              setConfirmOpen(false);
            }}
          >
            {t("settings.reset")}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
