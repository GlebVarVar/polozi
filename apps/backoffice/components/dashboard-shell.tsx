"use client";

import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/cn";
import { Spinner } from "@repo/ui/spinner";
import {
  Car,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/schools", label: "Schools", icon: Car },
  { href: "/dashboard/questions", label: "Questions", icon: HelpCircle },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { authed, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authed) router.replace("/");
  }, [ready, authed, router]);

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href || pathname === `${href}/` : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            P!
          </span>
          <span className="font-semibold">Položi! Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-8">
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span className="hidden text-sm text-muted-foreground md:block">
            Driving-exam administration
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
