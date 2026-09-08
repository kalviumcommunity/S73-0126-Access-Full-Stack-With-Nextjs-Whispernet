import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CloudOff,
  Database,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Marketing page. Statically rendered — it is the first thing a new school
 * loads, often on a slow link, so it must cost one HTML download and nothing
 * else.
 */
export const dynamic = "force-static";

const FEATURES = [
  {
    icon: CloudOff,
    title: "Works without a connection",
    body: "Pages you have opened stay available offline. Attendance marked with the network down is stored on the device and sent automatically once it returns.",
  },
  {
    icon: CalendarCheck,
    title: "Daily attendance register",
    body: "Mark a whole class in a few taps, with a running record of who was present, absent, late or excused, and a trend over the term.",
  },
  {
    icon: Users,
    title: "Student records",
    body: "One roll for the school: grades, sections, roll numbers and guardian contacts, searchable across every page of the register.",
  },
  {
    icon: BookOpen,
    title: "Textbooks that download",
    body: "Save a book to a device once and it stays readable — chapters, tables and all — with no connection at all.",
  },
  {
    icon: Database,
    title: "Cached, not recomputed",
    body: "Dashboard figures are served from Redis and cleared the moment records change, so pages stay fast without going stale.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Teachers manage their classes; administrators manage the school. Every request is verified on the server, not just in the browser.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="page-gradient min-h-dvh">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              RuralEdu
            </span>
          </span>

          <nav className="flex items-center gap-2" aria-label="Main">
            <Link
              href="/notices"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:block"
            >
              Notices
            </Link>
            <Link
              href="/textbooks"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:block"
            >
              Textbooks
            </Link>
            <Link href="/login" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="badge badge-success">
              <CloudOff className="h-3 w-3" aria-hidden />
              Built for intermittent connections
            </span>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
              A school portal that keeps working when the internet stops.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
              Rural schools lose connectivity for hours at a time. RuralEdu is
              built so that a teacher can still mark the register, look up a
              guardian&apos;s phone number and open a textbook — and everything
              catches up with the server on its own once the line returns.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">
                Create a staff account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/textbooks" className="btn btn-secondary">
                Browse textbooks
              </Link>
            </div>

            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Pupils and parents can read the{" "}
              <Link
                href="/notices"
                className="font-medium text-[var(--primary)] hover:underline"
              >
                notice board
              </Link>{" "}
              and every textbook without an account.
            </p>
          </div>
        </section>

        {/* Features */}
        <section
          aria-labelledby="features-heading"
          className="border-y border-[var(--border)] bg-[var(--surface)] py-16"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2
              id="features-heading"
              className="text-2xl font-semibold tracking-tight text-[var(--foreground)]"
            >
              What it does
            </h2>

            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <li key={feature.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How offline works */}
        <section
          aria-labelledby="offline-heading"
          className="mx-auto max-w-6xl px-4 py-16"
        >
          <div className="max-w-2xl">
            <h2
              id="offline-heading"
              className="text-2xl font-semibold tracking-tight text-[var(--foreground)]"
            >
              How the offline part actually works
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Three mechanisms, each doing one job.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Pages are cached as you visit them",
                body: "A service worker keeps a copy of every page you open, so revisiting it needs no network at all.",
              },
              {
                step: "2",
                title: "Data you have seen is stored locally",
                body: "Rosters and registers are saved to the browser database, and shown — clearly labelled — when the server cannot be reached.",
              },
              {
                step: "3",
                title: "Your changes queue up and sync",
                body: "Anything you save while offline goes to a local outbox and is sent, in order, the moment the connection comes back.",
              },
            ].map((item) => (
              <li key={item.step} className="surface p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                  {item.step}
                </span>
                <h3 className="mt-3 font-semibold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="surface mt-8 flex items-start gap-3 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Gauge className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">
                Install it like an app
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                RuralEdu is a progressive web app. Open it in a browser, choose
                &ldquo;Add to home screen&rdquo;, and it launches full-screen
                from the device — no store, no download, no updates to chase.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <BookOpen className="h-4 w-4" aria-hidden />
            RuralEdu · Offline-first school portal
          </span>
          <nav className="flex gap-4 text-sm" aria-label="Footer">
            <Link
              href="/notices"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Notices
            </Link>
            <Link
              href="/textbooks"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Textbooks
            </Link>
            <Link
              href="/login"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Staff sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
