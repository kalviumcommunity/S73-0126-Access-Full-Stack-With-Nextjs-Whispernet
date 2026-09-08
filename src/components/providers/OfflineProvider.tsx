"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listOutbox } from "@/lib/offline/db";
import { syncOutbox, type SyncReport } from "@/lib/offline/sync";
import { OUTBOX_CHANGED_EVENT } from "@/lib/http/apiClient";

interface OfflineContextValue {
  isOnline: boolean;
  /** Number of writes waiting to reach the server. */
  pendingCount: number;
  isSyncing: boolean;
  lastSync: SyncReport | null;
  /** Force a sync attempt; safe to call when already online and empty. */
  sync: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(
  undefined
);

export function OfflineProvider({ children }: { children: ReactNode }) {
  // Assume online during SSR and the first paint, so the UI never flashes an
  // offline warning on a perfectly good connection.
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncReport | null>(null);
  const syncing = useRef(false);

  const refreshPending = useCallback(async () => {
    const entries = await listOutbox();
    setPendingCount(entries.length);
  }, []);

  const sync = useCallback(async () => {
    // A reconnect can fire alongside a manual retry; only one run at a time.
    if (syncing.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    const entries = await listOutbox();
    if (entries.length === 0) {
      setPendingCount(0);
      return;
    }

    syncing.current = true;
    setIsSyncing(true);

    try {
      const report = await syncOutbox();
      setLastSync(report);
      setPendingCount(report.remaining);

      if (report.synced > 0) {
        // Let open screens reload the data that just changed on the server.
        window.dispatchEvent(
          new CustomEvent("ruraledu:synced", { detail: report })
        );
      }
    } finally {
      syncing.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine !== false);
    void refreshPending();

    const handleOnline = () => {
      setIsOnline(true);
      void sync();
    };
    const handleOffline = () => setIsOnline(false);
    const handleOutboxChanged = () => void refreshPending();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OUTBOX_CHANGED_EVENT, handleOutboxChanged);

    // `navigator.onLine` only reports whether an interface is up, so a captive
    // portal or a dead upstream still looks "online". A cheap periodic probe
    // catches that case; the endpoint is tiny and cached by nothing.
    const probe = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-store",
        });
        setIsOnline(response.ok);
        if (response.ok) void sync();
      } catch {
        setIsOnline(false);
      }
    }, 30_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OUTBOX_CHANGED_EVENT, handleOutboxChanged);
      window.clearInterval(probe);
    };
  }, [refreshPending, sync]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      pendingCount,
      isSyncing,
      lastSync,
      sync,
      refreshPending,
    }),
    [isOnline, pendingCount, isSyncing, lastSync, sync, refreshPending]
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used inside an OfflineProvider");
  }
  return context;
}
