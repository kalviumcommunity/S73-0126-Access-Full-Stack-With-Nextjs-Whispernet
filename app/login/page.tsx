"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  BookOpen,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post<{ token: string }>("/api/auth/login", {
        email,
        password,
      });

      if (response.success && response.data?.token) {
        login(response.data.token);
      } else {
        setError(response.message || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const response = await api.post<{ token: string }>("/api/auth/google", {
        credential,
        action: "login",
      });

      if (response.success && response.data?.token) {
        login(response.data.token);
      } else {
        setError(
          response.message || "Google sign-in failed. Please try again."
        );
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen hero-gradient noise-overlay flex flex-col">
      {/* Back to home */}
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Logo & Branding */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-30 animate-pulse-soft"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-200 mb-4">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">RuralEdu</h1>
          <p className="text-slate-500 text-sm mt-1">
            Offline-First Learning Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="animate-slide-up w-full max-w-md">
          <div className="glass rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-white/50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-500 mt-2">
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                <div className="p-1 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800 text-sm">
                    Login Failed
                  </p>
                  <p className="text-red-600 text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="teacher@school.edu"
                  className="input-modern"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input-modern pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Or Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                mode="signin"
              />
            </div>
            {isGoogleLoading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in with Google...
              </div>
            )}

            {/* Signup Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400">
                  New to RuralEdu?
                </span>
              </div>
            </div>

            {/* Signup Link */}
            <Link
              href="/signup"
              className="block w-full text-center py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Create an Account
            </Link>
          </div>

          {/* Offline Indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-sm text-slate-500 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Works offline once loaded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
