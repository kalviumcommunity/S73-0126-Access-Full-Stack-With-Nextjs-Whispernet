"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { api } from "@/lib/http/apiClient";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface SummaryResponse {
  range: { from: string; to: string };
  totals: { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number };
  recorded: number;
  totalStudents: number;
  attendanceRate: number | null;
  daily: {
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }[];
}

/**
 * Attendance over the last few weeks, drawn as plain divs.
 *
 * A charting library would be several times the weight of this entire page;
 * for a single bar series, CSS heights do the job at zero cost.
 */
export function AttendanceTrend() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await api.get<SummaryResponse>(
        "/api/attendance/summary"
      );
      if (response.success && response.data) setSummary(response.data);
      setIsLoading(false);
    };

    void load();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          title="Attendance trend"
        />
        <div className="p-5">
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (!summary || summary.daily.length === 0) {
    return (
      <Card>
        <CardHeader
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          title="Attendance trend"
          description="No attendance has been recorded yet."
        />
        <p className="p-5 text-sm text-[var(--muted-foreground)]">
          Once registers are marked, the last 30 days will be charted here.
        </p>
      </Card>
    );
  }

  const days = summary.daily.slice(-21);

  return (
    <Card>
      <CardHeader
        icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        title="Attendance trend"
        description={`Last ${days.length} school days · ${
          summary.attendanceRate ?? 0
        }% average attendance`}
      />

      <div className="p-5">
        {/* `items-stretch` (the default) matters: with `items-end` each column
            shrinks to its content, so the bars' percentage heights would
            resolve against zero and nothing would be drawn. */}
        <div
          className="flex h-32 items-stretch gap-1"
          role="img"
          aria-label={`Daily attendance rate over the last ${days.length} school days, averaging ${summary.attendanceRate ?? 0} percent`}
        >
          {days.map((day) => {
            const marked = day.present + day.absent + day.late + day.excused;
            const attending = day.present + day.late;
            const rate =
              marked === 0 ? 0 : Math.round((attending / marked) * 100);

            return (
              <div
                key={day.date}
                className="flex h-full flex-1 flex-col justify-end"
                // Native tooltip: no JS, works on every browser the school has.
                title={`${day.date}: ${rate}% present (${attending} of ${marked})`}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-colors",
                    rate >= 90
                      ? "bg-emerald-500"
                      : rate >= 75
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{ height: `${Math.max(rate, 3)}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>{days[0]?.date}</span>
          <span>{days[days.length - 1]?.date}</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-4">
          {(
            [
              ["Present", summary.totals.PRESENT, "text-emerald-700"],
              ["Absent", summary.totals.ABSENT, "text-red-700"],
              ["Late", summary.totals.LATE, "text-amber-700"],
              ["Excused", summary.totals.EXCUSED, "text-sky-700"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label}>
              <dt className="text-xs text-[var(--muted-foreground)]">
                {label}
              </dt>
              <dd className={cn("text-lg font-semibold", tone)}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
