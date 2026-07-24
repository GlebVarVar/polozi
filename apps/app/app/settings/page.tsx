"use client";

import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { cn } from "@repo/ui/lib/cn";
import {
  Globe,
  Monitor,
  Moon,
  Shuffle,
  SkipForward,
  Sun,
  Trash2,
  Type,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { AccountCard } from "../../components/account-card";
import { AppShell } from "../../components/app-shell";
import { PageHeader } from "../../components/states";
import { localeNames, locales } from "../../lib/i18n";
import { type FontSize, type Theme, useSettings } from "../../lib/settings";
import { clearProgress } from "../../lib/storage";

/** A labelled group of settings rendered as a grouped card (iOS-style). */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">{children}</div>
        </CardContent>
      </Card>
    </section>
  );
}

function Row({
  icon,
  label,
  description,
  children,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="pl-12 sm:pl-0 sm:shrink-0">{children}</div>
      ) : null}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-0.5 rounded-xl bg-secondary p-0.5"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
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

  const themeOptions: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "system", label: t("settings.theme.system"), icon: <Monitor className="size-4" /> },
    { value: "light", label: t("settings.theme.light"), icon: <Sun className="size-4" /> },
    { value: "dark", label: t("settings.theme.dark"), icon: <Moon className="size-4" /> },
  ];
  const fontOptions: { value: FontSize; label: string }[] = [
    { value: "small", label: t("settings.fontSize.small") },
    { value: "medium", label: t("settings.fontSize.medium") },
    { value: "large", label: t("settings.fontSize.large") },
  ];
  const langOptions = locales.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} />

      <div className="space-y-7">
        <AccountCard />

        <Section label={t("settings.section.appearance")}>
          <Row icon={<Globe className="size-4.5" />} label={t("settings.language")}>
            <Segmented
              ariaLabel={t("settings.language")}
              value={settings.language}
              options={langOptions}
              onChange={(v) => update({ language: v })}
            />
          </Row>
          <Row icon={<Sun className="size-4.5" />} label={t("settings.theme")}>
            <Segmented
              ariaLabel={t("settings.theme")}
              value={settings.theme}
              options={themeOptions}
              onChange={(v) => update({ theme: v })}
            />
          </Row>
          <Row icon={<Type className="size-4.5" />} label={t("settings.fontSize")}>
            <Segmented
              ariaLabel={t("settings.fontSize")}
              value={settings.fontSize}
              options={fontOptions}
              onChange={(v) => update({ fontSize: v })}
            />
          </Row>
        </Section>

        <Section label={t("settings.section.practice")}>
          <Row
            icon={<SkipForward className="size-4.5" />}
            label={t("settings.autoAdvance")}
            description={t("settings.autoAdvanceDesc")}
          >
            <Toggle
              label={t("settings.autoAdvance")}
              checked={settings.autoAdvance}
              onChange={(v) => update({ autoAdvance: v })}
            />
          </Row>
          <Row
            icon={<Shuffle className="size-4.5" />}
            label={t("settings.shuffle")}
            description={t("settings.shuffleDesc")}
          >
            <Toggle
              label={t("settings.shuffle")}
              checked={settings.shuffleAnswers}
              onChange={(v) => update({ shuffleAnswers: v })}
            />
          </Row>
        </Section>

        <Section label={t("settings.section.data")}>
          <Row
            icon={<Trash2 className="size-4.5 text-destructive" />}
            label={t("settings.reset")}
            description={t("settings.resetDesc")}
          >
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              {t("settings.reset")}
            </Button>
          </Row>
        </Section>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("settings.resetConfirm")}
      >
        <p className="mb-5 text-sm text-muted-foreground">
          {t("settings.resetDesc")}
        </p>
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
            <Trash2 className="size-4" />
            {t("settings.reset")}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
