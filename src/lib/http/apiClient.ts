// lib/http/apiClient.ts
// Offline-aware fetch wrapper used by every client component.
//
// Reads fall back to the last cached response when the network is gone; writes
// are queued in the outbox and replayed on reconnect. Callers get a normal
// promise either way and read `meta.source` to see what actually happened.

import {
  enqueueOutbox,
  readCachedResponse,
  writeCachedResponse,
} from "@/lib/offline/db";

export type ResponseSource = "network" | "cache" | "queued";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details?: unknown };
  timestamp: string;
  meta: {
    source: ResponseSource;
    /** Round-trip time in milliseconds. */
    durationMs: number;
    /** Server-reported Redis result, when the endpoint exposes one. */
    cache?: "HIT" | "MISS" | "BYPASS";
    /** When `source` is "cache", the age of the stored copy. */
    cachedAt?: number;
    status?: number;
  };
}

interface RequestOptions {
  headers?: Record<string, string>;
  /** Serve from and store into the offline read cache. Defaults to true for GET. */
  cache?: boolean;
  /** Queue this write when offline instead of failing. Requires `label`. */
  queueOffline?: boolean;
  /** Human-readable summary shown in the pending-changes tray. */
  label?: string;
  signal?: AbortSignal;
}

export const TOKEN_STORAGE_KEY = "ruraledu.token";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage disabled — the session simply won't survive a reload.
  }
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function envelope<T>(
  partial: Partial<ApiResponse<T>> & { success: boolean; message: string },
  meta: ApiResponse<T>["meta"]
): ApiResponse<T> {
  return {
    data: null as T,
    timestamp: new Date().toISOString(),
    ...partial,
    meta,
  };
}

/** Emitted after a queued write, so open screens can refresh their pending count. */
export const OUTBOX_CHANGED_EVENT = "ruraledu:outbox-changed";

function notifyOutboxChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVENT));
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const startedAt = Date.now();
  const isRead = method === "GET";
  const useCache = options.cache ?? isRead;
  const cacheKey = `${method} ${endpoint}`;

  // Offline: serve reads from IndexedDB, queue writes for later.
  if (!isOnline()) {
    if (isRead && useCache) {
      const cachedEntry = await readCachedResponse(cacheKey);
      if (cachedEntry) {
        const cachedBody = cachedEntry.body as ApiResponse<T>;
        return envelope<T>(
          {
            success: true,
            message: "Showing saved data (you are offline)",
            data: cachedBody.data,
          },
          {
            source: "cache",
            durationMs: Date.now() - startedAt,
            cachedAt: cachedEntry.cachedAt,
          }
        );
      }
    }

    if (!isRead && options.queueOffline) {
      await enqueueOutbox({
        method: method as "POST" | "PATCH" | "PUT" | "DELETE",
        endpoint,
        body,
        label: options.label ?? `${method} ${endpoint}`,
      });
      notifyOutboxChanged();

      return envelope<T>(
        {
          success: true,
          message: "Saved on this device. It will sync when you reconnect.",
        },
        { source: "queued", durationMs: Date.now() - startedAt }
      );
    }

    return envelope<T>(
      {
        success: false,
        message: "You are offline and this data has not been saved yet.",
        error: { code: "OFFLINE" },
      },
      { source: "network", durationMs: Date.now() - startedAt }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      signal: options.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = (await response.json()) as ApiResponse<T>;
    const durationMs = Date.now() - startedAt;
    const cacheHeader = response.headers.get("x-cache");

    const result: ApiResponse<T> = {
      ...payload,
      meta: {
        source: "network",
        durationMs,
        status: response.status,
        ...(cacheHeader
          ? { cache: cacheHeader as "HIT" | "MISS" | "BYPASS" }
          : {}),
      },
    };

    if (isRead && useCache && result.success) {
      void writeCachedResponse(cacheKey, { data: result.data });
    }

    return result;
  } catch (error) {
    // A failed fetch while nominally "online" usually means the connection
    // dropped mid-request — the same recovery path as being offline applies.
    if (isRead && useCache) {
      const cachedEntry = await readCachedResponse(cacheKey);
      if (cachedEntry) {
        const cachedBody = cachedEntry.body as ApiResponse<T>;
        return envelope<T>(
          {
            success: true,
            message: "Showing saved data (the network is unreachable)",
            data: cachedBody.data,
          },
          {
            source: "cache",
            durationMs: Date.now() - startedAt,
            cachedAt: cachedEntry.cachedAt,
          }
        );
      }
    }

    if (!isRead && options.queueOffline) {
      await enqueueOutbox({
        method: method as "POST" | "PATCH" | "PUT" | "DELETE",
        endpoint,
        body,
        label: options.label ?? `${method} ${endpoint}`,
      });
      notifyOutboxChanged();

      return envelope<T>(
        {
          success: true,
          message: "Saved on this device. It will sync when you reconnect.",
        },
        { source: "queued", durationMs: Date.now() - startedAt }
      );
    }

    const aborted =
      error instanceof DOMException && error.name === "AbortError";

    return envelope<T>(
      {
        success: false,
        message: aborted
          ? "Request cancelled"
          : "Could not reach the server. Check your connection.",
        error: { code: aborted ? "ABORTED" : "NETWORK_ERROR" },
      },
      { source: "network", durationMs: Date.now() - startedAt }
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", endpoint, body, options),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>("DELETE", endpoint, undefined, options),
};
