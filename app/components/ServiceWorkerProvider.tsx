"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function ServiceWorkerProvider() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setRegistration(reg);
        console.log("[PWA] Service Worker registered successfully");

        // Check if there's an update available
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setIsUpdateAvailable(true);
                console.log("[PWA] New version available!");
              }
            });
          }
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();

    // Handle controller change
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  if (!isUpdateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">Update Available</p>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">
            A new version of RuralEdu is ready.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Later
            </button>
            <button
              onClick={updateServiceWorker}
              className="flex-1 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
