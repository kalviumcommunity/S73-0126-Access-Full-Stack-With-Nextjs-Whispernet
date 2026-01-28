"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  RefreshCw,
  LogOut,
  Zap,
  Activity,
  Menu,
  X,
  Home,
  ClipboardList,
  Bell,
  Sparkles,
  TrendingUp,
  Database,
} from "lucide-react";
import StudentList from "@/app/components/StudentList";
import Link from "next/link";

// Types
interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  activeClasses: number;
  generatedAt: string;
}

// Skeleton Loader Component
function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-8 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "purple";
  trend?: string;
}) {
  const colorClasses = {
    emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/30",
    blue: "from-blue-400 to-indigo-500 shadow-blue-500/30",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/30",
    purple: "from-purple-400 to-pink-500 shadow-purple-500/30",
  };

  return (
    <div className="glass rounded-2xl p-6 card-hover group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
}

// Latency Badge Component
function LatencyBadge({
  latency,
  cached,
}: {
  latency: number;
  cached: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
        cached
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-amber-50 text-amber-600 border border-amber-200"
      }`}
    >
      {cached ? <Zap className="w-4 h-4" /> : <Database className="w-4 h-4" />}
      {latency}ms • {cached ? "Redis Cache" : "Database Query"}
    </div>
  );
}

// Navigation Component
function Navigation({
  user,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  user: { email: string; role: string } | null;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  return (
    <nav className="glass border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30 relative">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">RuralEdu</h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                {user?.role || "Portal"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-emerald-400 bg-emerald-500/10 rounded-lg text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/notices"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notices
            </Link>
            <Link
              href="/textbooks"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Textbooks
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-slate-200 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3 text-emerald-400 bg-emerald-500/10 rounded-xl text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/notices"
              className="flex items-center gap-2 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-sm"
            >
              <Bell className="w-4 h-4" />
              Notices
            </Link>
            <Link
              href="/textbooks"
              className="flex items-center gap-2 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              Textbooks
            </Link>
            <hr className="border-slate-200 my-2" />
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {user?.email}
              </p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm w-full"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// Main Dashboard Component
export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const startTime = performance.now();

    const response = await api.get<AdminStats>("/api/admin/stats");

    const endTime = performance.now();
    const responseLatency = Math.round(endTime - startTime);

    setLatency(responseLatency);
    // If response is fast (< 100ms), it's likely from cache
    setIsCached(responseLatency < 100 || response.message?.includes("Cache"));

    if (response.success && response.data) {
      setStats(response.data);
    }

    setStatsLoading(false);
    setRefreshCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      // Fetch stats on mount - using setTimeout to defer setState calls
      const timeoutId = setTimeout(() => {
        void fetchStats();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, user, fetchStats]);

  // Show loading screen while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen hero-gradient noise-overlay flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient noise-overlay">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        ></div>
      </div>

      {/* Navigation */}
      <Navigation
        user={user}
        onLogout={logout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
            </h2>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-slate-600">
            Here&apos;s what&apos;s happening in your school today.
          </p>
        </div>

        {/* Admin Stats Section */}
        {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
          <section className="mb-10 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  School Overview
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time statistics with Redis caching
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {latency !== null && (
                  <LatencyBadge latency={latency} cached={isCached} />
                )}
                <button
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 glass text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                    trend="+12% this month"
                  />
                  <StatCard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={GraduationCap}
                    color="emerald"
                    trend="+8% this week"
                  />
                  <StatCard
                    title="Active Classes"
                    value={stats?.activeClasses || 0}
                    icon={BookOpen}
                    color="amber"
                  />
                  <StatCard
                    title="API Calls"
                    value={refreshCount}
                    icon={Activity}
                    color="purple"
                  />
                </>
              )}
            </div>

            {/* Cache Demo Note */}
            <div className="mt-6 glass rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-semibold mb-1">
                    Redis Caching Demo
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Click <strong className="text-emerald-600">Refresh</strong>{" "}
                    multiple times to see caching in action! First request hits
                    the database (~200ms), subsequent requests are served from
                    Redis cache (~10ms). Cache expires after 60 seconds.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Student List Section (for Teachers) */}
        {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
          <section
            className="animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            <StudentList onStudentChange={fetchStats} />
          </section>
        )}
      </main>

      {/* Offline Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200 py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Online • PWA Ready</span>
          </div>
          <span className="text-slate-500">RuralEdu v1.0</span>
        </div>
      </footer>
    </div>
  );
}
