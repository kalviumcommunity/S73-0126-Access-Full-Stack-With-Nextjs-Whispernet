"use client";

import { CalendarCheck } from "lucide-react";
import { AttendanceRegister } from "@/features/attendance/AttendanceRegister";
import { AttendanceTrend } from "@/features/attendance/AttendanceTrend";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <CalendarCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Mark the daily register. It works with the network off — marks are
            kept on this device and sync when you reconnect.
          </p>
        </div>
      </header>

      <AttendanceRegister />
      <AttendanceTrend />
    </div>
  );
}
