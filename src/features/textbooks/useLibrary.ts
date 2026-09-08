"use client";

import { useCallback, useState } from "react";
import { useHydrated, useLocalStore } from "@/lib/utils/useLocalStore";

const PROGRESS_KEY = "ruraledu.reading";
const SAVED_KEY = "ruraledu.savedBooks";

/** `{ [textbookId]: number[] }` — chapter ids the reader has finished. */
type ProgressMap = Record<string, number[]>;

const NO_PROGRESS: ProgressMap = {};
const NO_SAVED: number[] = [];

/**
 * Tracks which chapters a pupil has finished.
 *
 * Deliberately per-device and unauthenticated: textbooks are readable without
 * an account, so progress belongs in local storage rather than the database.
 */
export function useReadingProgress() {
  const [progress, setProgress] = useLocalStore<ProgressMap>(
    PROGRESS_KEY,
    NO_PROGRESS
  );
  const isReady = useHydrated();

  const isRead = useCallback(
    (textbookId: number, chapterId: number) =>
      (progress[String(textbookId)] ?? []).includes(chapterId),
    [progress]
  );

  const completedCount = useCallback(
    (textbookId: number) => (progress[String(textbookId)] ?? []).length,
    [progress]
  );

  const setRead = useCallback(
    (textbookId: number, chapterId: number, read: boolean) => {
      const key = String(textbookId);
      const chapters = new Set(progress[key] ?? []);

      if (read) chapters.add(chapterId);
      else chapters.delete(chapterId);

      setProgress({
        ...progress,
        [key]: Array.from(chapters).sort((a, b) => a - b),
      });
    },
    [progress, setProgress]
  );

  const resetBook = useCallback(
    (textbookId: number) => {
      const next = { ...progress };
      delete next[String(textbookId)];
      setProgress(next);
    },
    [progress, setProgress]
  );

  return { progress, isReady, isRead, completedCount, setRead, resetBook };
}

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Downloads a book's pages into the service worker cache so it can be read
 * with no connection at all.
 *
 * The pages are simply requested: the service worker's fetch handler stores
 * each response on the way through, so a plain `fetch` is all it takes to make
 * a chapter permanently available on the device.
 */
export function useOfflineLibrary() {
  const [saved, setSaved] = useLocalStore<number[]>(SAVED_KEY, NO_SAVED);
  const [state, setState] = useState<Record<number, SaveState>>({});

  const isSaved = useCallback(
    (textbookId: number) => saved.includes(textbookId),
    [saved]
  );

  const save = useCallback(
    async (textbookId: number, paths: string[]) => {
      setState((current) => ({ ...current, [textbookId]: "saving" }));

      try {
        // Sequential rather than parallel: a rural connection copes far better
        // with one request at a time than with a burst of a dozen.
        for (const path of paths) {
          const response = await fetch(path, { cache: "reload" });
          if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        }

        setSaved(Array.from(new Set([...saved, textbookId])));
        setState((current) => ({ ...current, [textbookId]: "saved" }));
      } catch {
        setState((current) => ({ ...current, [textbookId]: "error" }));
      }
    },
    [saved, setSaved]
  );

  const forget = useCallback(
    (textbookId: number) => {
      setSaved(saved.filter((id) => id !== textbookId));
      setState((current) => ({ ...current, [textbookId]: "idle" }));
    },
    [saved, setSaved]
  );

  return { saved, isSaved, save, forget, state };
}
