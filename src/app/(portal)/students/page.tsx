"use client";

import { Users } from "lucide-react";
import { StudentRoster } from "@/features/students/StudentRoster";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Students
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Enrol pupils, keep guardian contact details current, and search the
            whole school roll.
          </p>
        </div>
      </header>

      <StudentRoster />
    </div>
  );
}
