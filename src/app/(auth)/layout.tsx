import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

/** Minimal chrome for the sign-in and sign-up pages. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-gradient flex min-h-dvh flex-col">
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
            <BookOpen className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            RuralEdu
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offline-first school portal
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}
