"use client";

import { CloudOff, CloudUpload, RefreshCw, Wifi } from "lucide-react";
import { useOffline } from "@/components/providers/OfflineProvider";
import { cn } from "@/lib/utils/cn";

/**
 * The honest answer to "can this device reach the school server right now?".
 *
 * The previous dashboard printed a hard-coded "Online" pill, which is precisely
 * the wrong thing to show a teacher whose connection has just dropped.
 */
export function ConnectionStatus({ className }: { className?: string }) {
  const { isOnline, pendingCount, isSyncing, sync } = useOffline();

  if (isSyncing) {
    return (
      <span className={cn("badge badge-info", className)}>
        <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />
        Syncing…
      </span>
    );
  }

  if (!isOnline) {
    return (
      <span className={cn("badge badge-warning", className)}>
        <CloudOff className="h-3 w-3" aria-hidden />
        Offline
        {pendingCount > 0 ? ` · ${pendingCount} to sync` : " · saved locally"}
      </span>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={() => void sync()}
        className={cn("badge badge-info hover:underline", className)}
      >
        <CloudUpload className="h-3 w-3" aria-hidden />
        {pendingCount} change{pendingCount === 1 ? "" : "s"} to sync
      </button>
    );
  }

  return (
    <span className={cn("badge badge-success", className)}>
      <Wifi className="h-3 w-3" aria-hidden />
      Online
    </span>
  );
}

/**
 * Full-width banner shown while the device is offline or has queued work.
 * Rendered once, at the top of the portal shell.
 */
export function ConnectionBanner() {
  const { isOnline, pendingCount, isSyncing, sync } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  const offline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "no-print border-b px-4 py-2.5 text-sm",
        offline
          ? "border-[#f3ddbf] bg-[var(--accent-soft)] text-[#8a3f07]"
          : "border-[#c8d6fb] bg-[var(--info-soft)] text-[#17389c]"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {offline ? (
            <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <CloudUpload className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {offline ? (
            <span>
              You are offline. Pages you have opened before still work, and
              anything you save is kept on this device.
            </span>
          ) : (
            <span>
              {pendingCount} change{pendingCount === 1 ? "" : "s"} saved on this
              device {pendingCount === 1 ? "is" : "are"} waiting to reach the
              server.
            </span>
          )}
        </span>

        {!offline ? (
          <button
            type="button"
            onClick={() => void sync()}
            disabled={isSyncing}
            className="btn btn-sm btn-secondary"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")}
              aria-hidden
            />
            {isSyncing ? "Syncing…" : "Sync now"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
