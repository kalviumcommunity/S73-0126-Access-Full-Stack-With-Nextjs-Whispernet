"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * Registers the service worker and offers an update when a new build lands.
 *
 * The reload is never automatic: a teacher halfway through marking a register
 * should not have the page swapped out from under them.
 */
export function ServiceWorkerProvider() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    let reloading = false;

    const onControllerChange = () => {
      // Only reload for an update the user actually accepted, otherwise the
      // very first registration would reload the page on every fresh visit.
      if (!reloading) return;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (registration.waiting) setWaitingWorker(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
            }
          });
        });
      } catch {
        // A failed registration only costs offline support, not the app.
      }
    };

    void register();
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const applyUpdate = () => {
      reloading = true;
    };
    window.addEventListener("ruraledu:sw-update", applyUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      window.removeEventListener("ruraledu:sw-update", applyUpdate);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  return (
    <div className="no-print fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="animate-in surface flex items-start gap-3 p-4 shadow-[var(--shadow-lg)]">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
          <RefreshCw className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Update available
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            A newer version of RuralEdu is ready to install.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("ruraledu:sw-update"));
                waitingWorker.postMessage({ type: "SKIP_WAITING" });
              }}
              className="btn btn-primary btn-sm"
            >
              Update now
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="btn btn-ghost btn-sm"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="btn btn-ghost -mr-1 -mt-1 h-7 min-h-0 w-7 rounded-md p-0"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
