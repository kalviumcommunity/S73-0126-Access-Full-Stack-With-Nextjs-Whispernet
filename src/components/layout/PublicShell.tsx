"use client";

import Link from "next/link";
import { BookOpen, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ConnectionBanner,
  ConnectionStatus,
} from "@/components/layout/ConnectionStatus";

/**
 * Chrome for pages a pupil or parent can open without an account — the notice
 * board and the textbook library. Staff who are already signed in get a route
 * straight back into the portal instead of a sign-in prompt.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

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
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              RuralEdu
            </span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1">
            <Link
              href="/notices"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              Notices
            </Link>
            <Link
              href="/textbooks"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              Textbooks
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ConnectionStatus className="hidden sm:inline-flex" />
            {isLoading ? null : isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-secondary btn-sm">
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                <LogIn className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Staff sign in</span>
              </Link>
            )}
          </div>
        </div>

        <ConnectionBanner />
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
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
