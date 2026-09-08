"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  Save,
  Users,
} from "lucide-react";
import { api } from "@/lib/http/apiClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  attendanceStatuses,
  todayIso,
  type AttendanceStatusValue,
} from "@/lib/validation/attendance";
import { initialsFor } from "@/features/students/types";

interface RosterEntry {
  studentId: number;
  name: string;
  rollNumber: string | null;
  status: AttendanceStatusValue | null;
  note: string | null;
  markedAt: string | null;
}

interface RegisterResponse {
  date: string;
  grade: number;
  section: string;
  roster: RosterEntry[];
  summary: {
    total: number;
    marked: number;
    pending: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

const STATUS_META: Record<
  AttendanceStatusValue,
  { label: string; short: string; active: string; idle: string }
> = {
  PRESENT: {
    label: "Present",
    short: "P",
    active: "bg-emerald-600 text-white border-emerald-600",
    idle: "text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  ABSENT: {
    label: "Absent",
    short: "A",
    active: "bg-red-600 text-white border-red-600",
    idle: "text-red-700 border-red-200 hover:bg-red-50",
  },
  LATE: {
    label: "Late",
    short: "L",
    active: "bg-amber-600 text-white border-amber-600",
    idle: "text-amber-800 border-amber-200 hover:bg-amber-50",
  },
  EXCUSED: {
    label: "Excused",
    short: "E",
    active: "bg-sky-600 text-white border-sky-600",
    idle: "text-sky-700 border-sky-200 hover:bg-sky-50",
  },
};

const GRADES = Array.from({ length: 12 }, (_, index) => index + 1);
const SECTIONS = ["A", "B", "C", "D"];

/** Stable reference, so an unloaded register does not invalidate memos. */
const NO_ROSTER: RosterEntry[] = [];

/**
 * The daily attendance register.
 *
 * Built to be filled in with no connection: the whole class loads in one
 * request, marks are held in local state, and saving queues to the outbox when
 * offline. The server upsert is keyed on (student, date), so a register that
 * syncs twice corrects itself rather than duplicating.
 */
export function AttendanceRegister() {
  const [date, setDate] = useState(todayIso());
  const [grade, setGrade] = useState(5);
  const [section, setSection] = useState("A");

  /** Identifies the register currently selected. */
  const registerKey = `${date}|${grade}|${section}`;

  const [loaded, setLoaded] = useState<{
    key: string;
    roster: RosterEntry[];
    fromCache: boolean;
  } | null>(null);
  const [marks, setMarks] = useState<Record<number, AttendanceStatusValue>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  // Derived rather than stored: the skeleton shows exactly while the data on
  // screen belongs to a different class or date than the one selected.
  const isLoading = loaded?.key !== registerKey;
  const roster = loaded?.key === registerKey ? loaded.roster : NO_ROSTER;
  const fromCache = loaded?.key === registerKey && loaded.fromCache;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const query = new URLSearchParams({
        date,
        grade: String(grade),
        section,
      });

      const response = await api.get<RegisterResponse>(
        `/api/attendance?${query.toString()}`
      );

      // The selection may have moved on while this was in flight.
      if (cancelled) return;

      if (response.success && response.data) {
        setLoaded({
          key: registerKey,
          roster: response.data.roster,
          fromCache: response.meta.source === "cache",
        });
        setMarks(
          Object.fromEntries(
            response.data.roster
              .filter((entry) => entry.status !== null)
              .map((entry) => [
                entry.studentId,
                entry.status as AttendanceStatusValue,
              ])
          )
        );
        setError("");
      } else {
        setLoaded({ key: registerKey, roster: NO_ROSTER, fromCache: false });
        setMarks({});
        setError(response.message);
      }

      setFlash("");
    };

    void run();

    // Re-read once queued registers have reached the server.
    const onSynced = () => void run();
    window.addEventListener("ruraledu:synced", onSynced);

    return () => {
      cancelled = true;
      window.removeEventListener("ruraledu:synced", onSynced);
    };
  }, [date, grade, section, registerKey]);

  const markedCount = Object.keys(marks).length;

  const counts = useMemo(() => {
    const tally = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const status of Object.values(marks)) tally[status] += 1;
    return tally;
  }, [marks]);

  const hasUnsavedChanges = useMemo(() => {
    return roster.some(
      (entry) => (marks[entry.studentId] ?? null) !== entry.status
    );
  }, [roster, marks]);

  // A teacher who navigates away mid-register would silently lose the marks.
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  const setStatus = (studentId: number, status: AttendanceStatusValue) => {
    setMarks((current) => ({ ...current, [studentId]: status }));
    setFlash("");
  };

  const markAll = (status: AttendanceStatusValue) => {
    setMarks(
      Object.fromEntries(roster.map((entry) => [entry.studentId, status]))
    );
    setFlash("");
  };

  const save = async () => {
    const records = roster
      .filter((entry) => marks[entry.studentId])
      .map((entry) => ({
        studentId: entry.studentId,
        status: marks[entry.studentId],
      }));

    if (records.length === 0) {
      setError("Mark at least one student before saving.");
      return;
    }

    setIsSaving(true);
    setError("");

    const response = await api.post(
      "/api/attendance",
      { date, records },
      {
        queueOffline: true,
        label: `Attendance for Grade ${grade}-${section} on ${date}`,
      }
    );

    setIsSaving(false);

    if (response.success) {
      setFlash(response.message);
      // Treat the saved marks as the new baseline so the unsaved-changes guard
      // clears, even when the write was only queued for later.
      setLoaded((current) =>
        current === null
          ? current
          : {
              ...current,
              roster: current.roster.map((entry) => ({
                ...entry,
                status: marks[entry.studentId] ?? entry.status,
              })),
            }
      );
    } else {
      setError(response.message);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Date</span>
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(event) => setDate(event.target.value)}
              className="field-input"
            />
          </label>

          <label className="block">
            <span className="field-label">Grade</span>
            <select
              value={grade}
              onChange={(event) => setGrade(Number(event.target.value))}
              className="field-input"
            >
              {GRADES.map((value) => (
                <option key={value} value={value}>
                  Grade {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Section</span>
            <select
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="field-input"
            >
              {SECTIONS.map((value) => (
                <option key={value} value={value}>
                  Section {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
          title={`Grade ${grade}-${section}`}
          description={
            isLoading
              ? "Loading the register…"
              : roster.length === 0
                ? "No pupils in this class"
                : `${markedCount} of ${roster.length} marked${
                    fromCache ? " · saved copy" : ""
                  }`
          }
          action={
            roster.length > 0 ? (
              <Button
                size="sm"
                onClick={() => void save()}
                loading={isSaving}
                disabled={!hasUnsavedChanges}
                icon={<Save className="h-4 w-4" aria-hidden />}
              >
                {hasUnsavedChanges
                  ? "Save register"
                  : markedCount === 0
                    ? "Nothing to save"
                    : "Saved"}
              </Button>
            ) : null
          }
        />

        <div className="space-y-4 p-5">
          {flash ? <Alert tone="success">{flash}</Alert> : null}
          {error ? <Alert>{error}</Alert> : null}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" aria-hidden />}
              title="No pupils in this class"
              description={`Grade ${grade}, section ${section} has no enrolled students. Add students from the Students page, or pick another class.`}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--surface-muted)] p-3">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Mark everyone:
                </span>
                {attendanceStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => markAll(status)}
                    className={cn(
                      "rounded-lg border bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold transition-colors",
                      STATUS_META[status].idle
                    )}
                  >
                    {STATUS_META[status].label}
                  </button>
                ))}
              </div>

              <ul className="space-y-2">
                {roster.map((entry) => {
                  const status = marks[entry.studentId];

                  return (
                    <li
                      key={entry.studentId}
                      className={cn(
                        "flex flex-wrap items-center gap-3 rounded-xl border p-3",
                        status
                          ? "border-[var(--border)]"
                          : "border-dashed border-[var(--border-strong)]"
                      )}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]"
                        aria-hidden
                      >
                        {entry.rollNumber ?? initialsFor(entry.name)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-[var(--foreground)]">
                          {entry.name}
                        </span>
                        {!status ? (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            Not marked yet
                          </span>
                        ) : null}
                      </span>

                      <div
                        role="radiogroup"
                        aria-label={`Attendance for ${entry.name}`}
                        className="flex gap-1"
                      >
                        {attendanceStatuses.map((value) => {
                          const meta = STATUS_META[value];
                          const selected = status === value;

                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={meta.label}
                              title={meta.label}
                              onClick={() => setStatus(entry.studentId, value)}
                              className={cn(
                                "h-9 w-9 rounded-lg border text-sm font-semibold transition-colors",
                                selected
                                  ? meta.active
                                  : cn("bg-[var(--surface)]", meta.idle)
                              )}
                            >
                              {meta.short}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">
                    <Check className="h-3 w-3" aria-hidden />
                    {counts.PRESENT} present
                  </Badge>
                  <Badge tone="danger">
                    <CircleAlert className="h-3 w-3" aria-hidden />
                    {counts.ABSENT} absent
                  </Badge>
                  <Badge tone="warning">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {counts.LATE} late
                  </Badge>
                  <Badge tone="info">
                    <FileText className="h-3 w-3" aria-hidden />
                    {counts.EXCUSED} excused
                  </Badge>
                </div>

                <Button
                  onClick={() => void save()}
                  loading={isSaving}
                  disabled={!hasUnsavedChanges}
                  icon={<Save className="h-4 w-4" aria-hidden />}
                >
                  {hasUnsavedChanges
                    ? `Save ${markedCount} mark${markedCount === 1 ? "" : "s"}`
                    : markedCount === 0
                      ? "Register not started"
                      : "All marks saved"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
