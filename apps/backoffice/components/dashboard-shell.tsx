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
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        P!
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">Položi!</span>
        <span className="text-xs text-muted-foreground">Backoffice</span>
      </div>
    </div>
  );
}

function SidebarNav({
  isActive,
  onNavigate,
  onLogout,
}: {
  isActive: (href: string, exact?: boolean) => boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-5 pb-2 pt-4">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Management
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { authed, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !authed) router.replace("/");
  }, [ready, authed, router]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    exact
      ? pathname === href || pathname === `${href}/`
      : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <SidebarNav isActive={isActive} onLogout={handleLogout} />
      </aside>

      {/* Mobile off-canvas drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
          <SidebarNav
            isActive={isActive}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm text-muted-foreground max-md:hidden">
            Driving-exam administration
          </span>
          <span className="text-sm font-semibold md:hidden">Backoffice</span>
          <span className="w-9 md:hidden" aria-hidden />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
