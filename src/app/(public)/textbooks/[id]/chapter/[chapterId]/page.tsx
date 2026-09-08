import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ChapterReader } from "@/features/textbooks/ChapterReader";
import {
  chapterOutline,
  renderChapter,
} from "@/features/textbooks/renderChapter";
import { getChapter, subjectTheme, textbooks } from "@/features/textbooks";

interface PageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

/** Pre-renders every chapter of every book, so the library works offline. */
export function generateStaticParams() {
  return textbooks.flatMap((book) =>
    book.chapters.map((chapter) => ({
      id: String(book.id),
      chapterId: String(chapter.id),
    }))
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, chapterId } = await params;
  const found = getChapter(Number(id), Number(chapterId));

  if (!found) return { title: "Chapter not found" };

  return {
    title: `${found.chapter.title} — ${found.textbook.title}`,
    description: `Chapter ${found.chapter.id} of ${found.textbook.title}. About ${found.chapter.minutes} minutes to read.`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { id, chapterId } = await params;
  const found = getChapter(Number(id), Number(chapterId));

  if (!found) notFound();

  const { textbook, chapter, index } = found;
  const theme = subjectTheme[textbook.accent];

  const previous = index > 0 ? textbook.chapters[index - 1] : null;
  const next =
    index < textbook.chapters.length - 1 ? textbook.chapters[index + 1] : null;

  // Rendered on the server at build time: the reader downloads finished HTML
  // rather than a markdown parser.
  const html = renderChapter(chapter.content);
  const outline = chapterOutline(chapter.content);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav aria-label="Breadcrumb" className="no-print">
        <Link
          href={`/textbooks/${textbook.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {textbook.title}
        </Link>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("badge", theme.chip)}>{textbook.subject}</span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Chapter {chapter.id} of {textbook.chapters.length}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3 w-3" aria-hidden />
            {chapter.minutes} min read
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {chapter.title}
        </h1>
      </header>

      <ChapterReader
        textbookId={textbook.id}
        chapterId={chapter.id}
        html={html}
        outline={outline}
      />

      <nav
        aria-label="Chapter navigation"
        className="no-print grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            href={`/textbooks/${textbook.id}/chapter/${previous.id}`}
            className="surface flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow)]"
          >
            <ChevronLeft
              className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-xs text-[var(--muted-foreground)]">
                Previous chapter
              </span>
              <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                {previous.title}
              </span>
            </span>
          </Link>
        ) : (
          <span aria-hidden />
        )}

        {next ? (
          <Link
            href={`/textbooks/${textbook.id}/chapter/${next.id}`}
            className="surface flex items-center justify-end gap-3 p-4 text-right transition-shadow hover:shadow-[var(--shadow)]"
          >
            <span className="min-w-0">
              <span className="block text-xs text-[var(--muted-foreground)]">
                Next chapter
              </span>
              <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                {next.title}
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]"
              aria-hidden
            />
          </Link>
        ) : (
          <Link
            href={`/textbooks/${textbook.id}`}
            className="surface flex items-center justify-end gap-3 p-4 text-right transition-shadow hover:shadow-[var(--shadow)]"
          >
            <span>
              <span className="block text-xs text-[var(--muted-foreground)]">
                End of the book
              </span>
              <span className="block text-sm font-medium text-[var(--primary)]">
                Back to chapters
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[var(--primary)]"
              aria-hidden
            />
          </Link>
        )}
      </nav>
    </div>
  );
}
