import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BookActions } from "@/features/textbooks/BookActions";
import {
  getTextbookById,
  gradeLabel,
  subjectTheme,
  textbooks,
  totalMinutes,
} from "@/features/textbooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Pre-renders a page for every book at build time. */
export function generateStaticParams() {
  return textbooks.map((book) => ({ id: String(book.id) }));
}

/** Anything not in `generateStaticParams` is a 404, not an on-demand render. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const book = getTextbookById(Number((await params).id));
  if (!book) return { title: "Textbook not found" };

  return {
    title: book.title,
    description: book.description,
  };
}

export default async function TextbookPage({ params }: PageProps) {
  const { id } = await params;
  const book = getTextbookById(Number(id));

  if (!book) notFound();

  const theme = subjectTheme[book.accent];
  const others = textbooks.filter((other) => other.id !== book.id);

  return (
    <div className="space-y-6">
      <Link
        href="/textbooks"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All textbooks
      </Link>

      <header className={cn("surface overflow-hidden")}>
        <div className={cn("flex items-start gap-4 p-6", theme.soft)}>
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              theme.solid
            )}
            aria-hidden
          >
            <BookOpen className="h-7 w-7" />
          </span>

          <div className="min-w-0">
            <span className={cn("badge", theme.chip)}>{book.subject}</span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {book.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              {book.description}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--border)] px-6 py-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Layers
              className="h-4 w-4 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <dt className="sr-only">Grades</dt>
            <dd className="text-[var(--muted-foreground)]">
              {gradeLabel(book)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen
              className="h-4 w-4 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <dt className="sr-only">Chapters</dt>
            <dd className="text-[var(--muted-foreground)]">
              {book.chapters.length} chapters
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock
              className="h-4 w-4 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <dt className="sr-only">Reading time</dt>
            <dd className="text-[var(--muted-foreground)]">
              {totalMinutes(book)} min in total
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Publisher</dt>
            <dd className="text-[var(--muted-foreground)]">
              {book.publisher} · {book.edition}
            </dd>
          </div>
        </dl>
      </header>

      <BookActions book={book} />

      <section
        aria-labelledby="more-books"
        className="border-t border-[var(--border)] pt-6"
      >
        <h2
          id="more-books"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
        >
          Other books
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((other) => {
            const otherTheme = subjectTheme[other.accent];
            return (
              <li key={other.id}>
                <Link
                  href={`/textbooks/${other.id}`}
                  className="surface flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-[var(--shadow)]"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      otherTheme.solid
                    )}
                    aria-hidden
                  >
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {other.title}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {other.subject} · {gradeLabel(other)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
