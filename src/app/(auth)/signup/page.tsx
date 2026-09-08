"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth, type AuthUser } from "@/components/providers/AuthProvider";
import { useOffline } from "@/components/providers/OfflineProvider";
import { api } from "@/lib/http/apiClient";
import { Alert, Button, Card, Field } from "@/components/ui";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import { signupSchema } from "@/lib/validation/auth";

interface AuthPayload {
  token: string;
  user: AuthUser;
}

/** Simple, honest password feedback — no false sense of security. */
function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  tone: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[^a-zA-Z]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;

  const capped = Math.min(score, 3) as 0 | 1 | 2 | 3;

  return [
    { score: capped, label: "Too short", tone: "bg-[var(--danger)]" },
    { score: capped, label: "Weak", tone: "bg-[var(--accent)]" },
    { score: capped, label: "Good", tone: "bg-[var(--info)]" },
    { score: capped, label: "Strong", tone: "bg-[var(--primary)]" },
  ][capped];
}

export default function SignupPage() {
  const { login } = useAuth();
  const { isOnline } = useOffline();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  const strength = useMemo(
    () => passwordStrength(form.password),
    [form.password]
  );

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setErrors({});

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "The two passwords do not match" });
      return;
    }

    const parsed = signupSchema.safeParse({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
    });

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
    const response = await api.post<AuthPayload>(
      "/api/auth/signup",
      parsed.data,
      { cache: false }
    );
    setIsSubmitting(false);

    if (response.success && response.data?.token) {
      login(response.data.token, response.data.user);
      return;
    }

    const details = response.error?.details;
    if (Array.isArray(details)) {
      const fieldErrors: Record<string, string> = {};
      for (const item of details as { field: string; message: string }[]) {
        if (!fieldErrors[item.field]) fieldErrors[item.field] = item.message;
      }
      setErrors(fieldErrors);
    } else {
      setError(response.message);
    }
  };

  const signUpWithGoogle = async (credential: string) => {
    setError("");
    setIsGoogleBusy(true);

    const response = await api.post<AuthPayload>(
      "/api/auth/google",
      { credential, action: "signup" },
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
        Create a staff account
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        New accounts join as teachers. An administrator can change that later.
      </p>

      <div className="mt-5 space-y-3">
        {!isOnline ? (
          <Alert tone="warning" title="You are offline">
            Creating an account needs a connection to the school server.
          </Alert>
        ) : null}
        {error ? <Alert>{error}</Alert> : null}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name" error={errors.name} required>
          {(props) => (
            <input
              {...props}
              className="field-input"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              autoComplete="name"
              placeholder="Sunita Deshmukh"
              required
            />
          )}
        </Field>

        <Field label="Email address" error={errors.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              className="field-input"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
              placeholder="teacher@ruraledu.in"
              required
            />
          )}
        </Field>

        <Field label="Phone number" error={errors.phone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              className="field-input"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              autoComplete="tel"
              placeholder="9876500002"
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint="At least 8 characters."
          required
        >
          {(props) => (
            <div className="relative">
              <input
                {...props}
                type={showPassword ? "text" : "password"}
                className="field-input pr-11"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                autoComplete="new-password"
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

        {form.password ? (
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]"
              role="presentation"
            >
              <div
                className={`h-full rounded-full transition-all ${strength.tone}`}
                style={{ width: `${((strength.score + 1) / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              {strength.label}
            </span>
          </div>
        ) : null}

        <Field label="Confirm password" error={errors.confirmPassword} required>
          {(props) => (
            <input
              {...props}
              type={showPassword ? "text" : "password"}
              className="field-input"
              value={form.confirmPassword}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
              autoComplete="new-password"
              required
            />
          )}
        </Field>

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={isGoogleBusy || !isOnline}
          icon={<UserPlus className="h-4 w-4" aria-hidden />}
        >
          Create account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-foreground)]">or</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <GoogleSignInButton
        mode="signup"
        disabled={isSubmitting || isGoogleBusy || !isOnline}
        onCredential={(credential) => void signUpWithGoogle(credential)}
        onError={setError}
      />

      <p className="mt-6 border-t border-[var(--border)] pt-5 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
