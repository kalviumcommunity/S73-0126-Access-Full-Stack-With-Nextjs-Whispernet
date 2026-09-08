"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  Database,
  GraduationCap,
  HardDriveDownload,
  Layers,
  RefreshCw,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOffline } from "@/components/providers/OfflineProvider";
import { api, type ApiResponse } from "@/lib/http/apiClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Skeleton,
} from "@/components/ui";
import { AttendanceTrend } from "@/features/attendance/AttendanceTrend";
import { cn } from "@/lib/utils/cn";

interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  activeNotices: number;
  totalStaff?: number;
  attendance: {
    date: string;
    marked: number;
    present: number;
    rate: number | null;
    pending: number;
  };
  generatedAt: string;
  cache: {
    status: "HIT" | "MISS" | "BYPASS";
    durationMs: number;
    connected: boolean;
    ttlSeconds: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { isOnline, pendingCount } = useOffline();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);

  /** Applies a settled response. Never called synchronously from an effect. */
  const apply = useCallback((response: ApiResponse<DashboardStats>) => {
    if (response.success && response.data) {
      setStats(response.data);
      setFromCache(response.meta.source === "cache");
      setRoundTripMs(response.meta.durationMs);
      setError("");
    } else {
      setError(response.message);
    }
    setIsLoading(false);
  }, []);

  /** Manual refresh: an event handler, so showing the spinner here is fine. */
  const refresh = useCallback(() => {
    setIsLoading(true);
    setError("");
    void api.get<DashboardStats>("/api/dashboard/stats").then(apply);
  }, [apply]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const response = await api.get<DashboardStats>("/api/dashboard/stats");
      if (!cancelled) apply(response);
    };

    void run();

    // Refresh once queued offline changes have reached the server.
    const onSynced = () => void run();
    window.addEventListener("ruraledu:synced", onSynced);

    return () => {
      cancelled = true;
      window.removeEventListener("ruraledu:synced", onSynced);
    };
  }, [apply]);

  const firstName = user?.name?.split(" ")[0] ?? user?.email.split("@")[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Good day{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {stats?.attendance.pending && stats.attendance.pending > 0
            ? `${stats.attendance.pending} pupil${stats.attendance.pending === 1 ? " has" : "s have"} not been marked today.`
            : "Here is how the school looks today."}
        </p>
      </header>

      {error ? <Alert>{error}</Alert> : null}

      {pendingCount > 0 ? (
        <Alert tone="info" title="Changes waiting to sync">
          {pendingCount} change{pendingCount === 1 ? "" : "s"} made on this
          device {pendingCount === 1 ? "has" : "have"} not reached the server
          yet. The figures below may be behind until they do.
        </Alert>
      ) : null}

      {/* Headline figures */}
      <section aria-label="School overview">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && !stats ? (
            Array.from({ length: 4 }, (_, index) => (
              <Card key={index} className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
              </Card>
            ))
          ) : (
            <>
              <StatCard
                label="Students enrolled"
                value={stats?.totalStudents ?? 0}
                icon={<GraduationCap className="h-5 w-5" aria-hidden />}
                href="/students"
              />
              <StatCard
                label="Marked today"
                value={
                  stats
                    ? `${stats.attendance.marked}/${stats.totalStudents}`
                    : "—"
                }
                hint={
                  stats?.attendance.rate !== null &&
                  stats?.attendance.rate !== undefined
                    ? `${stats.attendance.rate}% present`
                    : "Register not started"
                }
                icon={<CalendarCheck className="h-5 w-5" aria-hidden />}
                href="/attendance"
              />
              <StatCard
                label="Active classes"
                value={stats?.activeClasses ?? 0}
                icon={<Layers className="h-5 w-5" aria-hidden />}
              />
              {stats?.totalStaff !== undefined ? (
                <StatCard
                  label="Staff accounts"
                  value={stats.totalStaff}
                  icon={<UserCog className="h-5 w-5" aria-hidden />}
                />
              ) : (
                <StatCard
                  label="Notices on the board"
                  value={stats?.activeNotices ?? 0}
                  icon={<Bell className="h-5 w-5" aria-hidden />}
                  href="/notices"
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions">
        <h2
          id="quick-actions"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
        >
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            href="/attendance"
            icon={<CalendarCheck className="h-5 w-5" aria-hidden />}
            title="Mark the register"
            description="Record today's attendance"
          />
          <ActionCard
            href="/students"
            icon={<Users className="h-5 w-5" aria-hidden />}
            title="Student records"
            description="Enrol pupils, update contacts"
          />
          <ActionCard
            href="/notices"
            icon={<Bell className="h-5 w-5" aria-hidden />}
            title="Publish a notice"
            description="Post to the school board"
          />
          <ActionCard
            href="/textbooks"
            icon={<BookOpen className="h-5 w-5" aria-hidden />}
            title="Textbook library"
            description="Save books for offline reading"
          />
        </div>
      </section>

      <AttendanceTrend />

      {/* Infrastructure panel — reports what actually happened, not a guess. */}
      <Card>
        <CardHeader
          icon={<Zap className="h-4 w-4" aria-hidden />}
          title="Data freshness"
          description="Where the figures above came from"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={refresh}
              loading={isLoading}
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
            >
              Refresh
            </Button>
          }
        />

        <dl className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[var(--muted-foreground)]">Source</dt>
            <dd className="mt-1.5">
              {fromCache ? (
                <Badge tone="warning">
                  <HardDriveDownload className="h-3 w-3" aria-hidden />
                  This device (offline copy)
                </Badge>
              ) : stats?.cache.status === "HIT" ? (
                <Badge tone="success">
                  <Zap className="h-3 w-3" aria-hidden />
                  Redis cache
                </Badge>
              ) : stats?.cache.status === "BYPASS" ? (
                <Badge tone="warning">
                  <Database className="h-3 w-3" aria-hidden />
                  Database (cache unavailable)
                </Badge>
              ) : (
                <Badge tone="info">
                  <Database className="h-3 w-3" aria-hidden />
                  Database
                </Badge>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--muted-foreground)]">
              Round trip
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-[var(--foreground)]">
              {roundTripMs === null ? "—" : `${roundTripMs} ms`}
              {stats ? (
                <span className="ml-1 font-normal text-[var(--muted-foreground)]">
                  ({stats.cache.durationMs} ms server-side)
                </span>
              ) : null}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--muted-foreground)]">
              Connection
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-[var(--foreground)]">
              {isOnline ? "Online" : "Offline"}
              {stats && !stats.cache.connected ? (
                <span className="ml-1 font-normal text-[var(--accent)]">
                  · cache down
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        <p className="border-t border-[var(--border)] px-5 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          Statistics are cached in Redis for {stats?.cache.ttlSeconds ?? 60}{" "}
          seconds and cleared immediately whenever a student, notice or register
          changes. Press Refresh twice to watch the source switch from Database
          to Redis cache.
        </p>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          {label}
        </p>
        <span className="text-[var(--primary)]" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "surface block p-5 transition-shadow hover:shadow-[var(--shadow)]"
        )}
      >
        {body}
      </Link>
    );
  }

  return <Card className="p-5">{body}</Card>;
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="surface flex items-start gap-3 p-4 transition-shadow hover:shadow-[var(--shadow)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium text-[var(--foreground)]">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
          {description}
        </span>
      </span>
    </Link>
  );
}
