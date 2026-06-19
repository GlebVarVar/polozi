"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type Locale,
  defaultLocale,
  locales,
  t as translate,
} from "./i18n";

const LOCALE_PARAM = "lang";
const STORAGE_KEY = "polozi-locale";

function isLocale(value: string | null): value is Locale {
  return value !== null && locales.includes(value as Locale);
}

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Initialize from `?lang=` query param (e.g. /privacy/?lang=ru), falling
  // back to a previously stored choice. Runs after mount to keep the static
  // export's server-rendered markup (always defaultLocale) hydration-safe.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get(
      LOCALE_PARAM,
    );
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = isLocale(fromQuery)
      ? fromQuery
      : isLocale(stored)
        ? stored
        : null;

    if (next && next !== defaultLocale) {
      setLocaleState(next);
    }
    document.documentElement.lang = next ?? defaultLocale;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    window.localStorage.setItem(STORAGE_KEY, newLocale);

    // Reflect the choice in the URL so the link stays shareable.
    const url = new URL(window.location.href);
    url.searchParams.set(LOCALE_PARAM, newLocale);
    window.history.replaceState(null, "", url);
  }, []);

  const t = useCallback(
    (key: string) => translate(locale, key),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
