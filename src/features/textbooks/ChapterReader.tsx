"use client";

import { useEffect, useState } from "react";
import { Check, ListTree, Minus, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useLocalStore } from "@/lib/utils/useLocalStore";
import { useReadingProgress } from "./useLibrary";

const FONT_KEY = "ruraledu.fontScale";
const SCALES = [0.9, 1, 1.15, 1.3] as const;

interface ChapterReaderProps {
  textbookId: number;
  chapterId: number;
  html: string;
  outline: { id: string; title: string; level: number }[];
}

/**
 * The chapter reading surface.
 *
 * Beyond rendering the text it carries the two controls that matter most on a
 * shared classroom device: a text-size setting that persists, and a "mark as
 * read" toggle that drives progress across the library.
 */
export function ChapterReader({
  textbookId,
  chapterId,
  html,
  outline,
}: ChapterReaderProps) {
  const { isRead, setRead, isReady } = useReadingProgress();
  // The text size a reader picks should still be there next chapter, and on
  // every other device they share.
  const [storedScale, setStoredScale] = useLocalStore<number>(FONT_KEY, 1);
  const [showOutline, setShowOutline] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  const scaleIndex =
    Number.isInteger(storedScale) &&
    storedScale >= 0 &&
    storedScale < SCALES.length
      ? storedScale
      : 1;

  const changeScale = (delta: number) => {
    setStoredScale(
      Math.min(SCALES.length - 1, Math.max(0, scaleIndex + delta))
    );
  };

  // Progress bar for the chapter, so a reader on a small screen can see how
  // much is left without scrolling to find out.
  useEffect(() => {
    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollPercent(
        scrollable <= 0
          ? 100
          : Math.min(100, Math.round((window.scrollY / scrollable) * 100))
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const read = isReady && isRead(textbookId, chapterId);

  return (
    <>
      <div
        className="no-print fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
        aria-hidden
      >
        <div
          className="h-full bg-[var(--primary)] transition-[width] duration-150"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {outline.length > 1 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowOutline((open) => !open)}
            aria-expanded={showOutline}
            icon={<ListTree className="h-4 w-4" aria-hidden />}
          >
            Contents
          </Button>
        ) : null}

        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => changeScale(-1)}
            disabled={scaleIndex === 0}
            aria-label="Decrease text size"
            className="btn btn-ghost h-8 min-h-0 w-8 rounded-lg p-0"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="px-1 text-xs font-medium text-[var(--muted-foreground)]">
            Text
          </span>
          <button
            type="button"
            onClick={() => changeScale(1)}
            disabled={scaleIndex === SCALES.length - 1}
            aria-label="Increase text size"
            className="btn btn-ghost h-8 min-h-0 w-8 rounded-lg p-0"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          icon={<Printer className="h-4 w-4" aria-hidden />}
        >
          Print
        </Button>

        <Button
          variant={read ? "primary" : "secondary"}
          size="sm"
          onClick={() => setRead(textbookId, chapterId, !read)}
          className="ml-auto"
          icon={<Check className="h-4 w-4" aria-hidden />}
        >
          {read ? "Read" : "Mark as read"}
        </Button>
      </div>

      {showOutline && outline.length > 1 ? (
        <nav
          aria-label="Chapter contents"
          className="no-print animate-in surface mb-4 p-4"
        >
          <ul className="space-y-1 text-sm">
            {outline.map((entry) => (
              <li
                key={entry.id}
                className={entry.level === 3 ? "ml-4" : undefined}
              >
                <a
                  href={`#${entry.id}`}
                  onClick={() => setShowOutline(false)}
                  className="block rounded px-2 py-1 text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <article
        className={cn("surface chapter-prose p-6 sm:p-8")}
        style={{ fontSize: `${SCALES[scaleIndex]}rem` }}
        // Chapter markdown is authored in-repo and escaped by `renderChapter`
        // before any tags are added.
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="no-print mt-4 flex justify-center">
        <Button
          variant={read ? "secondary" : "primary"}
          onClick={() => setRead(textbookId, chapterId, !read)}
          icon={<Check className="h-4 w-4" aria-hidden />}
        >
          {read ? "Marked as read" : "I have finished this chapter"}
        </Button>
      </div>
    </>
  );
}
