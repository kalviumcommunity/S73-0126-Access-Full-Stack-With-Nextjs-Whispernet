"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  mode: "signin" | "signup";
  disabled?: boolean;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: Record<string, string | number>
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Google Identity Services button.
 *
 * Renders nothing at all when no client id is configured, so a deployment
 * without Google OAuth simply shows email sign-in rather than a broken button.
 */
export default function GoogleSignInButton({
  onCredential,
  onError,
  mode,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );

  // Held in refs so a re-render of the parent cannot re-trigger the effect
  // that mounts Google's button. Refs are written in an effect, never during
  // render, so the component stays safe to re-render at any time.
  const handleCredential = useRef(onCredential);
  const handleError = useRef(onError);

  useEffect(() => {
    handleCredential.current = onCredential;
    handleError.current = onError;
  }, [onCredential, onError]);

  const renderButton = useCallback(() => {
    if (!containerRef.current || !window.google || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential)
            handleCredential.current(response.credential);
          else handleError.current("Google did not return a sign-in token.");
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: mode === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 320,
      });

      setStatus("ready");
    } catch {
      setStatus("failed");
      handleError.current("Google Sign-In could not be started.");
    }
  }, [clientId, mode]);

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      // The script is already there (navigating between sign-in and sign-up).
      // Rendering on a microtask keeps mounting free of synchronous state
      // updates, which would otherwise cascade an extra render.
      queueMicrotask(renderButton);
      return;
    }

    // Reuse the tag if another mount already added it, so navigating between
    // sign-in and sign-up does not load the script twice.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );

    const script = existing ?? document.createElement("script");
    const onLoad = () => renderButton();
    const onScriptError = () => {
      setStatus("failed");
      handleError.current(
        "Google Sign-In could not be reached. Use your email and password instead."
      );
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onScriptError);

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onScriptError);
    };
  }, [clientId, renderButton]);

  if (!clientId) return null;

  if (status === "failed") {
    return (
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Google Sign-In is unavailable right now.
      </p>
    );
  }

  return (
    <div
      className={disabled ? "pointer-events-none opacity-50" : undefined}
      aria-busy={status === "loading"}
    >
      {status === "loading" ? (
        <div className="flex h-11 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)]">
          <Loader2
            className="h-4 w-4 animate-spin text-[var(--muted-foreground)]"
            aria-hidden
          />
          <span className="sr-only">Loading Google Sign-In</span>
        </div>
      ) : null}
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
