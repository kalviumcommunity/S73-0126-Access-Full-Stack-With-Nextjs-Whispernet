// lib/offline/db.ts
// A tiny promise wrapper over IndexedDB.
//
// IndexedDB (rather than localStorage) because the read cache holds whole API
// responses and the outbox must survive a tab closing mid-sync — neither fits
// in a 5 MB synchronous string store.

const DB_NAME = "ruraledu";
const DB_VERSION = 1;

export const STORE_RESPONSES = "responses";
export const STORE_OUTBOX = "outbox";

export interface CachedResponse {
  /** Request key: `GET /api/students?page=1`. */
  key: string;
  body: unknown;
  cachedAt: number;
}

export interface OutboxEntry {
  id?: number;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  body: unknown;
  /** Human-readable summary shown in the sync tray, e.g. "Add student Anita". */
  label: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      // Private browsing modes can throw on open.
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_RESPONSES)) {
        db.createObjectStore(STORE_RESPONSES, { keyPath: "key" });
      }

      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function getDatabase(): Promise<IDBDatabase | null> {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return getDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(storeName, mode);
          const request = action(transaction.objectStore(storeName));

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

// --- Response cache ---------------------------------------------------------

export async function readCachedResponse(
  key: string
): Promise<CachedResponse | null> {
  const result = await runTransaction<CachedResponse>(
    STORE_RESPONSES,
    "readonly",
    (store) => store.get(key) as IDBRequest<CachedResponse>
  );
  return result ?? null;
}

export async function writeCachedResponse(
  key: string,
  body: unknown
): Promise<void> {
  await runTransaction(STORE_RESPONSES, "readwrite", (store) =>
    store.put({ key, body, cachedAt: Date.now() } satisfies CachedResponse)
  );
}

export async function clearCachedResponses(): Promise<void> {
  await runTransaction(STORE_RESPONSES, "readwrite", (store) => store.clear());
}

// --- Outbox -----------------------------------------------------------------

export async function enqueueOutbox(
  entry: Omit<OutboxEntry, "id" | "createdAt" | "attempts">
): Promise<void> {
  await runTransaction(STORE_OUTBOX, "readwrite", (store) =>
    store.add({ ...entry, createdAt: Date.now(), attempts: 0 })
  );
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const result = await runTransaction<OutboxEntry[]>(
    STORE_OUTBOX,
    "readonly",
    (store) => store.getAll() as IDBRequest<OutboxEntry[]>
  );
  return (result ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeFromOutbox(id: number): Promise<void> {
  await runTransaction(STORE_OUTBOX, "readwrite", (store) => store.delete(id));
}

export async function updateOutboxEntry(entry: OutboxEntry): Promise<void> {
  await runTransaction(STORE_OUTBOX, "readwrite", (store) => store.put(entry));
}

export async function clearOutbox(): Promise<void> {
  await runTransaction(STORE_OUTBOX, "readwrite", (store) => store.clear());
}
