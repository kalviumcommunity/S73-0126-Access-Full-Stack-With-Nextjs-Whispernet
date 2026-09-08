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
import { useRouter, usePathname } from "next/navigation";
import { api, readToken, writeToken } from "@/lib/http/apiClient";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  avatar?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  login: (token: string, user?: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Routes that render without a session. */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/notices", "/textbooks"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

interface TokenClaims {
  userId: number;
  email: string;
  role: UserRole;
  name?: string | null;
  avatar?: string | null;
  exp?: number;
}

/**
 * Decodes a JWT payload without verifying it.
 *
 * This is only used to render the shell instantly on load; the token is still
 * verified server-side on every request, and `/api/auth/me` confirms the
 * session shortly after mount.
 */
function decodeClaims(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const decoded = decodeURIComponent(
      json
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(decoded) as TokenClaims;
  } catch {
    return null;
  }
}

function isExpired(claims: TokenClaims | null): boolean {
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const expiryTimer = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    writeToken(null);
    setUser(null);
    if (expiryTimer.current) {
      window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  /**
   * Signs the user out the moment the token expires, rather than letting them
   * keep clicking into silent 401s until the next reload.
   */
  const scheduleExpiry = useCallback(
    (claims: TokenClaims) => {
      if (expiryTimer.current) window.clearTimeout(expiryTimer.current);
      if (!claims.exp) return;

      const msRemaining = claims.exp * 1000 - Date.now();
      // setTimeout saturates past ~24.8 days; re-arm on the next load instead.
      if (msRemaining <= 0 || msRemaining > 2_147_483_647) return;

      expiryTimer.current = window.setTimeout(() => {
        clearSession();
        router.replace("/login?reason=expired");
      }, msRemaining);
    },
    [clearSession, router]
  );

  const login = useCallback(
    (token: string, nextUser?: AuthUser) => {
      const claims = decodeClaims(token);
      if (!claims || isExpired(claims)) return;

      writeToken(token);
      setUser(
        nextUser ?? {
          id: claims.userId,
          email: claims.email,
          name: claims.name ?? null,
          role: claims.role,
          avatar: claims.avatar,
        }
      );
      scheduleExpiry(claims);
      router.replace("/dashboard");
    },
    [router, scheduleExpiry]
  );

  // Restore the session on first paint, then confirm it against the server.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const token = readToken();
      const claims = token ? decodeClaims(token) : null;

      if (!token || !claims || isExpired(claims)) {
        writeToken(null);
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (!cancelled) {
        setUser({
          id: claims.userId,
          email: claims.email,
          name: claims.name ?? null,
          role: claims.role,
          avatar: claims.avatar,
        });
        scheduleExpiry(claims);
        setIsLoading(false);
      }

      // Revalidate against the database so a role change or a deleted account
      // takes effect without waiting for the token to expire. Skipped while
      // offline, where the cached claims are the best available answer.
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        return;

      const response = await api.get<{ user: AuthUser }>("/api/auth/me", {
        cache: false,
      });

      if (cancelled) return;

      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else if (response.error?.code === "UNAUTHORIZED") {
        clearSession();
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [clearSession, scheduleExpiry]);

  // Sign out in every open tab when one of them signs out.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "ruraledu.token" && event.newValue === null) {
        setUser(null);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Route protection.
  useEffect(() => {
    if (isLoading) return;

    if (!user && !isPublicRoute(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (user && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
    }
  }, [user, pathname, isLoading, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isStaff: user?.role === "TEACHER" || user?.role === "ADMIN",
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
