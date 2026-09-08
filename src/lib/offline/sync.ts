// lib/offline/sync.ts
// Replays queued writes once the connection is back.

import {
  listOutbox,
  removeFromOutbox,
  updateOutboxEntry,
  type OutboxEntry,
} from "./db";
import { readToken } from "@/lib/http/apiClient";

const MAX_ATTEMPTS = 5;

export interface SyncReport {
  synced: number;
  failed: number;
  remaining: number;
}

/**
 * Sends every queued mutation in the order it was made.
 *
 * Order matters: "create student" must land before "mark that student present",
 * so the first entry that fails with a retryable error stops the run and leaves
 * the rest of the queue intact.
 */
export async function syncOutbox(): Promise<SyncReport> {
  const entries = await listOutbox();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    const outcome = await sendEntry(entry);

    if (outcome === "sent") {
      synced += 1;
      continue;
    }

    if (outcome === "rejected") {
      // The server refused it outright (validation, duplicate, gone). Retrying
      // will never help, so drop it rather than blocking the queue forever.
      failed += 1;
      continue;
    }

    // Network still unavailable — stop and keep the remaining order intact.
    break;
  }

  const remaining = (await listOutbox()).length;
  return { synced, failed, remaining };
}

type SendOutcome = "sent" | "rejected" | "retry";

async function sendEntry(entry: OutboxEntry): Promise<SendOutcome> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(entry.endpoint, {
      method: entry.method,
      headers,
      body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
    });

    if (response.ok) {
      if (entry.id !== undefined) await removeFromOutbox(entry.id);
      return "sent";
    }

    // 4xx (except 408/429) means the request itself is the problem.
    const permanent =
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 408 &&
      response.status !== 429;

    if (permanent) {
      if (entry.id !== undefined) await removeFromOutbox(entry.id);
      return "rejected";
    }

    await recordAttempt(entry, `Server responded ${response.status}`);
    return "retry";
  } catch (error) {
    await recordAttempt(
      entry,
      error instanceof Error ? error.message : "Network unreachable"
    );
    return "retry";
  }
}

async function recordAttempt(entry: OutboxEntry, reason: string) {
  const attempts = entry.attempts + 1;

  if (attempts >= MAX_ATTEMPTS) {
    // Give up rather than retrying forever on every reconnect.
    if (entry.id !== undefined) await removeFromOutbox(entry.id);
    return;
  }

  await updateOutboxEntry({ ...entry, attempts, lastError: reason });
}
