import type { Metadata } from "next";
import { BookOpen, Clock, Library, WifiOff } from "lucide-react";
import { Card } from "@/components/ui";
import { LibraryBrowser } from "@/features/textbooks/LibraryBrowser";
import { textbooks, totalMinutes } from "@/features/textbooks";

/**
 * Static Site Generation.
 *
 * The whole catalogue ships in the build output, so the library page needs no
 * database, no API call, and no round trip — it is the fastest thing in the app
 * and works with the connection off.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Textbooks",
  description:
    "Read your textbooks online or save them to this device and read them with no connection at all.",
};

export default function TextbooksPage() {
  const chapterCount = textbooks.reduce(
    (sum, book) => sum + book.chapters.length,
    0
  );
  const minutes = textbooks.reduce((sum, book) => sum + totalMinutes(book), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Library className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Textbook library
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Read here, or save a book to this device and read it with no
            connection at all.
          </p>
        </div>
      </header>

      {/* Honest counts, computed from the catalogue itself. */}
      <dl className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Books
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {textbooks.length}
          </dd>
        </Card>
        <Card className="p-4">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Library className="h-3.5 w-3.5" aria-hidden />
            Chapters
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {chapterCount}
          </dd>
        </Card>
        <Card className="p-4">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Reading
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {Math.round(minutes / 60)}h
          </dd>
        </Card>
      </dl>

      <div className="flex items-start gap-3 rounded-xl border border-[#c8d6fb] bg-[var(--info-soft)] px-4 py-3 text-sm text-[#17389c]">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">Reading without internet:</strong>{" "}
          tap <em>Save offline</em> on a book while you have a connection. Its
          chapters are stored on this device and stay readable afterwards, even
          with the network off.
        </p>
      </div>

      <LibraryBrowser />
    </div>
  );
}
