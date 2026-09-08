"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { PortalShell } from "@/components/layout/PortalShell";

/**
 * Shared chrome and auth gate for every signed-in screen.
 *
 * `AuthProvider` performs the redirect; this layout only avoids flashing
 * portal chrome at someone who is about to be sent to the sign-in page.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <Loader2
          className="h-7 w-7 animate-spin text-[var(--primary)]"
          aria-hidden
        />
        <p className="text-sm text-[var(--muted-foreground)]">
          {isLoading ? "Loading your portal…" : "Redirecting to sign in…"}
        </p>
      </div>
    );
  }

  return <PortalShell>{children}</PortalShell>;
}
