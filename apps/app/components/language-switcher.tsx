"use client";

import { cn } from "@repo/ui/lib/cn";
import { locales } from "../lib/i18n";
import { useSettings } from "../lib/settings";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => update({ language: loc })}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            settings.language === loc
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={settings.language === loc}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
