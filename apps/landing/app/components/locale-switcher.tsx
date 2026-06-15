"use client";

import { useLocale } from "../../lib/locale-context";
import { locales, localeFlags, localeNames } from "../../lib/i18n";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Change language"
      >
        <Globe size={16} />
        {localeFlags[locale]}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50 min-w-[140px]">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                l === locale
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              <span className="font-mono text-xs">{localeFlags[l]}</span>
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
