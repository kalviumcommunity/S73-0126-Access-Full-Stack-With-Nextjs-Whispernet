"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// Types
interface User {
  userId: number;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT Decoder (lightweight, no library needed)
function decodeJWT(token: string): User | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded) return true;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/login", "/signup", "/"];

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken && !isTokenExpired(storedToken)) {
      const decodedUser = decodeJWT(storedToken);
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setToken(storedToken);
        setUser(decodedUser);
        setIsLoading(false);
      });
    } else {
      // Clear expired token
      localStorage.removeItem("token");
      queueMicrotask(() => {
        setIsLoading(false);
      });
    }
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!token && !isPublicRoute) {
      // Redirect to login if not authenticated and on protected route
      router.push("/login");
    } else if (token && pathname === "/login") {
      // Redirect to dashboard if already logged in
      router.push("/dashboard");
    }
  }, [token, pathname, isLoading, router]);

  // Login function
  const login = useCallback(
    (newToken: string) => {
      const decodedUser = decodeJWT(newToken);
      if (decodedUser) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(decodedUser);
        router.push("/dashboard");
      }
    },
    [router]
  );

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
