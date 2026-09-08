"use client";

import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { bookPaths, subjectTheme, type Textbook } from "./index";
import { useOfflineLibrary, useReadingProgress } from "./useLibrary";

/**
 * The interactive half of a book page: chapter list with read markers,
 * progress, and the offline download control.
 */
export function BookActions({ book }: { book: Textbook }) {
  const { isRead, completedCount, resetBook, isReady } = useReadingProgress();
  const { isSaved, save, forget, state } = useOfflineLibrary();

  const theme = subjectTheme[book.accent];
  const completed = isReady ? completedCount(book.id) : 0;
  const percent = Math.round((completed / book.chapters.length) * 100);
  const saveState = state[book.id] ?? "idle";
  const savedOffline = isSaved(book.id);

  // Resume where the reader stopped, rather than always at chapter one.
  const nextChapter =
    book.chapters.find((chapter) => !isRead(book.id, chapter.id)) ??
    book.chapters[0];

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {completed === book.chapters.length
                ? "You have finished this book"
                : completed === 0
                  ? "Not started yet"
                  : `${completed} of ${book.chapters.length} chapters read`}
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)] sm:w-64"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Reading progress"
            >
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/textbooks/${book.id}/chapter/${nextChapter.id}`}
              className="btn btn-primary btn-sm"
            >
              {completed === 0
                ? "Start reading"
                : completed === book.chapters.length
                  ? "Read again"
                  : "Continue reading"}
            </Link>

            {savedOffline ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => forget(book.id)}
                icon={<Trash2 className="h-4 w-4" aria-hidden />}
              >
                Remove download
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void save(book.id, bookPaths(book))}
                disabled={saveState === "saving"}
                icon={
                  saveState === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "error"
                    ? "Retry download"
                    : "Save for offline"}
              </Button>
            )}

            {completed > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetBook(book.id)}
                icon={<RotateCcw className="h-4 w-4" aria-hidden />}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {savedOffline ? (
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
            Every chapter of this book is stored on this device and will open
            without a connection.
          </p>
        ) : null}

        {saveState === "error" ? (
          <p className="mt-3 text-xs text-[var(--danger)]">
            Some chapters could not be downloaded. Check your connection and try
            again.
          </p>
        ) : null}
      </Card>

      <section aria-labelledby="chapters-heading">
        <h2
          id="chapters-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
        >
          Chapters
        </h2>

        <ol className="space-y-2">
          {book.chapters.map((chapter) => {
            const read = isReady && isRead(book.id, chapter.id);

            return (
              <li key={chapter.id}>
                <Link
                  href={`/textbooks/${book.id}/chapter/${chapter.id}`}
                  className="surface flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow)]"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                      read ? "bg-[var(--primary)] text-white" : theme.chip
                    )}
                    aria-hidden
                  >
                    {read ? <Check className="h-5 w-5" /> : chapter.id}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--foreground)]">
                      {chapter.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Clock className="h-3 w-3" aria-hidden />
                      {chapter.minutes} min read
                    </span>
                  </span>

                  {read ? (
                    <Badge tone="success">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Read
                    </Badge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
