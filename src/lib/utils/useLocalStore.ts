"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads a JSON value out of `localStorage` as a React external store.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: localStorage is
 * genuinely external state, so this keeps every reader of a key in sync (across
 * components *and* browser tabs), renders the server snapshot during SSR
 * without a hydration mismatch, and avoids a cascading render on mount.
 */

const CHANGE_EVENT = "ruraledu:localstore";

/** Cached parsed snapshots — `getSnapshot` must be referentially stable. */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Fires when another tab writes to localStorage.
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Returns the parsed value for `key`, or `fallback`.
 *
 * The result is memoised against the raw string so repeated calls return the
 * identical object; returning a fresh parse each time would make React loop.
 */
function getSnapshot<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const cached = snapshots.get(key);

  if (cached && cached.raw === raw) return cached.value as T;

  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }

  snapshots.set(key, { raw, value });
  return value;
}

export function useLocalStore<T>(
  key: string,
  fallback: T
): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => getSnapshot(key, fallback),
    // During SSR and the first client render there is no storage to read, so
    // both snapshots agree on the fallback and hydration stays clean.
    () => fallback
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage full or blocked: keep the in-memory snapshot so the current
        // session still behaves, it just will not survive a reload.
      }
      snapshots.set(key, { raw: readRaw(key), value: next });
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    },
    [key]
  );

  return [value, setValue];
}

/**
 * True once the component has hydrated on the client.
 *
 * Values read from storage are only meaningful after this flips, so UI that
 * would otherwise flash a default (a "0 chapters read" badge, say) can wait.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
