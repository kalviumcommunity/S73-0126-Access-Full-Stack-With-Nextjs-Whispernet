"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bell,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ConnectionBanner,
  ConnectionStatus,
} from "@/components/layout/ConnectionStatus";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/notices", label: "Notices", icon: Bell },
  { href: "/textbooks", label: "Textbooks", icon: BookOpen },
] as const;

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

/** Chrome shared by every signed-in page: navigation, identity, connection state. */
export function PortalShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:shadow-[var(--shadow)]"
      >
        Skip to content
      </a>

      <header className="no-print sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              RuralEdu
            </span>
          </Link>

          <nav
            aria-label="Main"
            className="hidden items-center gap-0.5 md:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCurrent(item.href)
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ConnectionStatus className="hidden sm:inline-flex" />

            <div className="hidden items-center gap-2 md:flex">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]"
                aria-hidden
              >
                {user ? initials(user.name, user.email) : "?"}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {user?.name ?? user?.email.split("@")[0]}
                </p>
                <p className="text-xs capitalize text-[var(--muted-foreground)]">
                  {user?.role.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="btn btn-ghost ml-1 h-9 min-h-0 w-9 rounded-lg p-0"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="btn btn-ghost h-10 min-h-0 w-10 rounded-lg p-0 md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="animate-in border-t border-[var(--border)] px-4 py-3 md:hidden"
          >
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isCurrent(item.href)
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {user?.name ?? user?.email}
                </p>
                <p className="text-xs capitalize text-[var(--muted-foreground)]">
                  {user?.role.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </div>
          </nav>
        ) : null}

        <ConnectionBanner />
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="no-print border-t border-[var(--border)] bg-[var(--surface)] py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-[var(--muted-foreground)]">
          <span>RuralEdu · Offline-first school portal</span>
          <ConnectionStatus />
        </div>
      </footer>
    </div>
  );
}
