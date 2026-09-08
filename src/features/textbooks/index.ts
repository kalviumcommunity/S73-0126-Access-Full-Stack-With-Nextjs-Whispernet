// features/textbooks/index.ts
// Lookups and presentation helpers over the static textbook library.

import {
  textbooks,
  type Chapter,
  type SubjectAccent,
  type Textbook,
} from "./data";

export { textbooks };
export type { Chapter, Textbook, SubjectAccent };

export function getTextbookById(id: number): Textbook | undefined {
  return textbooks.find((book) => book.id === id);
}

export function getChapter(
  textbookId: number,
  chapterId: number
): { textbook: Textbook; chapter: Chapter; index: number } | undefined {
  const textbook = getTextbookById(textbookId);
  if (!textbook) return undefined;

  const index = textbook.chapters.findIndex((c) => c.id === chapterId);
  if (index === -1) return undefined;

  return { textbook, chapter: textbook.chapters[index], index };
}

/** Total estimated reading time for a book, in minutes. */
export function totalMinutes(book: Textbook): number {
  return book.chapters.reduce((sum, chapter) => sum + chapter.minutes, 0);
}

/** "Grade 6–8" or "Grade 5" for a book's grade range. */
export function gradeLabel(book: Textbook): string {
  const sorted = [...book.grades].sort((a, b) => a - b);
  if (sorted.length === 0) return "All grades";
  if (sorted.length === 1) return `Grade ${sorted[0]}`;
  return `Grade ${sorted[0]}–${sorted[sorted.length - 1]}`;
}

/** Every grade covered by the library, ascending — drives the grade filter. */
export function allGrades(): number[] {
  const grades = new Set<number>();
  for (const book of textbooks)
    for (const grade of book.grades) grades.add(grade);
  return Array.from(grades).sort((a, b) => a - b);
}

export function allSubjects(): string[] {
  return Array.from(new Set(textbooks.map((book) => book.subject))).sort();
}

/**
 * Concrete classes per accent.
 *
 * Written out in full because Tailwind only ships classes it can see in the
 * source — an interpolated `bg-${accent}-500` compiles to nothing at all,
 * which is why the old cards rendered with invisible icons.
 */
export const subjectTheme: Record<
  SubjectAccent,
  { chip: string; solid: string; soft: string; text: string; rule: string }
> = {
  green: {
    chip: "bg-emerald-100 text-emerald-800",
    solid: "bg-emerald-600 text-white",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    rule: "border-emerald-500",
  },
  blue: {
    chip: "bg-sky-100 text-sky-800",
    solid: "bg-sky-600 text-white",
    soft: "bg-sky-50",
    text: "text-sky-700",
    rule: "border-sky-500",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800",
    solid: "bg-violet-600 text-white",
    soft: "bg-violet-50",
    text: "text-violet-700",
    rule: "border-violet-500",
  },
  amber: {
    chip: "bg-amber-100 text-amber-900",
    solid: "bg-amber-600 text-white",
    soft: "bg-amber-50",
    text: "text-amber-800",
    rule: "border-amber-500",
  },
  rose: {
    chip: "bg-rose-100 text-rose-800",
    solid: "bg-rose-600 text-white",
    soft: "bg-rose-50",
    text: "text-rose-700",
    rule: "border-rose-500",
  },
};

/** Every chapter URL in the library, used to pre-cache the whole library. */
export function allChapterPaths(): string[] {
  return textbooks.flatMap((book) => [
    `/textbooks/${book.id}`,
    ...book.chapters.map(
      (chapter) => `/textbooks/${book.id}/chapter/${chapter.id}`
    ),
  ]);
}

/** The chapter URLs for a single book. */
export function bookPaths(book: Textbook): string[] {
  return [
    `/textbooks/${book.id}`,
    ...book.chapters.map(
      (chapter) => `/textbooks/${book.id}/chapter/${chapter.id}`
    ),
  ];
}
