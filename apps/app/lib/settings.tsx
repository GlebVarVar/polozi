"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultLocale, type Locale, t as translate } from "./i18n";

export type Theme = "system" | "light" | "dark";
export type FontSize = "small" | "medium" | "large";

export interface Settings {
  language: Locale;
  theme: Theme;
  fontSize: FontSize;
  autoAdvance: boolean;
  shuffleAnswers: boolean;
}

const DEFAULTS: Settings = {
  language: defaultLocale,
  theme: "system",
  fontSize: "medium",
  autoAdvance: false,
  shuffleAnswers: false,
};

const KEY = "polozi.settings";

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  t: (key: string) => string;
};

const SettingsContext = createContext<Ctx | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  // apply side effects whenever settings change
  useEffect(() => {
    applyTheme(settings.theme);
    document.documentElement.lang = settings.language;
    document.documentElement.dataset.fontSize = settings.fontSize;
  }, [settings.theme, settings.language, settings.fontSize]);

  // react to OS theme changes when in "system" mode
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const t = (key: string) => translate(settings.language, key);

  return (
    <SettingsContext.Provider value={{ settings, update, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
