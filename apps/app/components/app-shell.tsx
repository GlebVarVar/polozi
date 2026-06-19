"use client";

import { cn } from "@repo/ui/lib/cn";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Home,
  type LucideIcon,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSettings } from "../lib/settings";
import { LanguageSwitcher } from "./language-switcher";

interface NavItem {
  href: string;
  icon: LucideIcon;
  labelKey: string;
}

const NAV: NavItem[] = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/training", icon: GraduationCap, labelKey: "nav.training" },
  { href: "/exam", icon: ClipboardCheck, labelKey: "nav.exam" },
  { href: "/schools", icon: Building2, labelKey: "nav.schools" },
  { href: "/stats", icon: BarChart3, labelKey: "nav.stats" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
];

function isActive(pathname: string, href: string): boolean {
  const norm = pathname.replace(/\/$/, "") || "/";
  if (href === "/") return norm === "/";
  return norm === href || norm.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useSettings();
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            {t("app.name")}
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, icon: Icon, labelKey }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 px-1">
          <LanguageSwitcher />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              {t("app.name")}
            </span>
          </Link>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        {NAV.map(({ href, icon: Icon, labelKey }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5" />
              <span className="leading-none">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
