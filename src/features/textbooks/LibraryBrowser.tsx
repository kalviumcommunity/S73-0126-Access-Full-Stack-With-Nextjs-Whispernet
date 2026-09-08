"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Search,
  Trash2,
  WifiOff,
} from "lucide-react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  allGrades,
  allSubjects,
  bookPaths,
  gradeLabel,
  subjectTheme,
  textbooks,
  totalMinutes,
} from "./index";
import { useOfflineLibrary, useReadingProgress } from "./useLibrary";

// The catalogue is static, so these are computed once at module load rather
// than memoised per mount.
const SUBJECTS = allSubjects();
const GRADES = allGrades();

/**
 * The textbook library.
 *
 * Search, subject and grade filters run entirely on the client — the whole
 * catalogue is already in the page, so filtering costs no network at all.
 */
export function LibraryBrowser() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string>("ALL");
  const [grade, setGrade] = useState<number | "ALL">("ALL");

  const { isRead, completedCount, isReady } = useReadingProgress();
  const { isSaved, save, forget, state } = useOfflineLibrary();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return textbooks.filter((book) => {
      if (subject !== "ALL" && book.subject !== subject) return false;
      if (grade !== "ALL" && !book.grades.includes(grade)) return false;
      if (!term) return true;

      return (
        book.title.toLowerCase().includes(term) ||
        book.subject.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term) ||
        book.chapters.some((chapter) =>
          chapter.title.toLowerCase().includes(term)
        )
      );
    });
  }, [search, subject, grade]);

  const hasFilters = search !== "" || subject !== "ALL" || grade !== "ALL";

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search books and chapters"
            aria-label="Search books and chapters"
            className="field-input pl-9"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-[var(--muted-foreground)]">
              Subject
            </span>
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="field-input"
            >
              <option value="ALL">All subjects</option>
              {SUBJECTS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-[var(--muted-foreground)]">
              Grade
            </span>
            <select
              value={String(grade)}
              onChange={(event) =>
                setGrade(
                  event.target.value === "ALL"
                    ? "ALL"
                    : Number(event.target.value)
                )
              }
              className="field-input"
            >
              <option value="ALL">All grades</option>
              {GRADES.map((value) => (
                <option key={value} value={value}>
                  Grade {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">
              {visible.length} of {textbooks.length} books
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubject("ALL");
                setGrade("ALL");
              }}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-6 w-6" aria-hidden />}
            title="No books match those filters"
            description="Try a different subject or grade, or search for a chapter title."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setSubject("ALL");
                  setGrade("ALL");
                }}
              >
                Show all books
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((book) => {
            const theme = subjectTheme[book.accent];
            const completed = isReady ? completedCount(book.id) : 0;
            const saveState = state[book.id] ?? "idle";
            const savedOffline = isSaved(book.id);

            return (
              <li key={book.id}>
                <Card className="flex h-full flex-col overflow-hidden">
                  <div
                    className={cn(
                      "flex items-start justify-between gap-3 p-5",
                      theme.soft
                    )}
                  >
                    <div className="min-w-0">
                      <span className={cn("badge", theme.chip)}>
                        {book.subject}
                      </span>
                      <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--foreground)]">
                        <Link
                          href={`/textbooks/${book.id}`}
                          className="hover:underline"
                        >
                          {book.title}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {gradeLabel(book)} · {book.edition}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        theme.solid
                      )}
                      aria-hidden
                    >
                      <BookOpen className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {book.description}
                    </p>

                    <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <dt className="sr-only">Chapters</dt>
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        <dd>{book.chapters.length} chapters</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <dt className="sr-only">Reading time</dt>
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        <dd>{totalMinutes(book)} min read</dd>
                      </div>
                      {savedOffline ? (
                        <div className="flex items-center gap-1 text-[var(--primary)]">
                          <dt className="sr-only">Offline status</dt>
                          <WifiOff className="h-3.5 w-3.5" aria-hidden />
                          <dd>Available offline</dd>
                        </div>
                      ) : null}
                    </dl>

                    {completed > 0 ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--muted-foreground)]">
                            {completed} of {book.chapters.length} chapters read
                          </span>
                          {completed === book.chapters.length ? (
                            <Badge tone="success">
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                              Finished
                            </Badge>
                          ) : null}
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
                          role="progressbar"
                          aria-valuenow={completed}
                          aria-valuemin={0}
                          aria-valuemax={book.chapters.length}
                          aria-label={`Reading progress for ${book.title}`}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-[width]"
                            style={{
                              width: `${(completed / book.chapters.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <ul className="mt-4 space-y-1 border-t border-[var(--border)] pt-4">
                      {book.chapters.map((chapter) => (
                        <li key={chapter.id}>
                          <Link
                            href={`/textbooks/${book.id}/chapter/${chapter.id}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                          >
                            {isReady && isRead(book.id, chapter.id) ? (
                              <Check
                                className="h-4 w-4 shrink-0 text-[var(--primary)]"
                                aria-label="Read"
                              />
                            ) : (
                              <span
                                className="h-4 w-4 shrink-0 text-center text-xs leading-4 text-[var(--muted-foreground)]"
                                aria-hidden
                              >
                                {chapter.id}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {chapter.title}
                            </span>
                            <span className="shrink-0 text-xs">
                              {chapter.minutes}m
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex gap-2 pt-1">
                      <Link
                        href={`/textbooks/${book.id}`}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Open book
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </Link>

                      {savedOffline ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => forget(book.id)}
                          icon={<Trash2 className="h-4 w-4" aria-hidden />}
                          title="Remove from offline reading"
                        >
                          Saved
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void save(book.id, bookPaths(book))}
                          disabled={saveState === "saving"}
                          icon={
                            saveState === "saving" ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Download className="h-4 w-4" aria-hidden />
                            )
                          }
                        >
                          {saveState === "saving"
                            ? "Saving…"
                            : saveState === "error"
                              ? "Retry"
                              : "Save offline"}
                        </Button>
                      )}
                    </div>

                    {saveState === "error" ? (
                      <p className="mt-2 text-xs text-[var(--danger)]">
                        Could not download every chapter. Reconnect and try
                        again.
                      </p>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
