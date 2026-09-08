"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOffline } from "@/components/providers/OfflineProvider";
import { api } from "@/lib/http/apiClient";
import { Alert, Button, Card, Field } from "@/components/ui";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import { loginSchema } from "@/lib/validation/auth";
import type { AuthUser } from "@/components/providers/AuthProvider";

interface AuthPayload {
  token: string;
  user: AuthUser;
}

function LoginForm() {
  const { login } = useAuth();
  const { isOnline } = useOffline();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  const expired = searchParams.get("reason") === "expired";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    // Signing in must reach the server; there is nothing useful to queue.
    const response = await api.post<AuthPayload>(
      "/api/auth/login",
      parsed.data,
      { cache: false }
    );
    setIsSubmitting(false);

    if (response.success && response.data?.token) {
      login(response.data.token, response.data.user);
    } else {
      setError(response.message);
    }
  };

  const signInWithGoogle = async (credential: string) => {
    setError("");
    setIsGoogleBusy(true);

    const response = await api.post<AuthPayload>(
      "/api/auth/google",
      { credential, action: "login" },
      { cache: false }
    );
    setIsGoogleBusy(false);

    if (response.success && response.data?.token) {
      login(response.data.token, response.data.user);
    } else {
      setError(response.message);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        For teachers and school administrators.
      </p>

      <div className="mt-5 space-y-3">
        {expired ? (
          <Alert tone="warning" title="Your session expired">
            Please sign in again to continue.
          </Alert>
        ) : null}

        {!isOnline ? (
          <Alert tone="warning" title="You are offline">
            Signing in needs a connection to the school server. Textbooks and
            notices you have already opened still work.
          </Alert>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Email address" error={errors.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              className="field-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="teacher@ruraledu.in"
              required
            />
          )}
        </Field>

        <Field label="Password" error={errors.password} required>
          {(props) => (
            <div className="relative">
              <input
                {...props}
                type={showPassword ? "text" : "password"}
                className="field-input pr-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          )}
        </Field>

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={isGoogleBusy || !isOnline}
          icon={<LogIn className="h-4 w-4" aria-hidden />}
        >
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-foreground)]">or</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <GoogleSignInButton
        mode="signin"
        disabled={isSubmitting || isGoogleBusy || !isOnline}
        onCredential={(credential) => void signInWithGoogle(credential)}
        onError={setError}
      />

      <p className="mt-6 border-t border-[var(--border)] pt-5 text-center text-sm text-[var(--muted-foreground)]">
        New to RuralEdu?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Create a staff account
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  // `useSearchParams` needs a Suspense boundary during static rendering.
  return (
    <Suspense
      fallback={<Card className="h-96 w-full max-w-md animate-pulse p-8" />}
    >
      <LoginForm />
    </Suspense>
  );
}
