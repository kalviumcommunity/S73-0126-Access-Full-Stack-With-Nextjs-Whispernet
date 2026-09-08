"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Phone,
  Search,
  Trash2,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
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
import { StudentForm } from "./StudentForm";
import { initialsFor, type Student, type StudentListResponse } from "./types";

const PAGE_SIZE = 10;

/**
 * The student roster.
 *
 * Search and filtering are sent to the server rather than applied to the
 * current page: the old client-side filter silently missed every pupil who was
 * not on the ten rows already rendered.
 */
export function StudentRoster() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [fromCache, setFromCache] = useState(false);

  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [flash, setFlash] = useState("");

  // Aborts an in-flight list request when the query changes again, so a slow
  // response cannot overwrite a newer one.
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(
    async (nextPage: number, nextSearch: string, nextGrade: string) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setIsLoading(true);
      setLoadError("");

      const query = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      if (nextSearch.trim()) query.set("search", nextSearch.trim());
      if (nextGrade) query.set("grade", nextGrade);

      const response = await api.get<StudentListResponse>(
        `/api/students?${query.toString()}`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      if (response.success && response.data) {
        setStudents(response.data.students);
        setMeta(response.data.meta);
        setFromCache(response.meta.source === "cache");
      } else if (response.error?.code !== "ABORTED") {
        setLoadError(response.message);
      }

      setIsLoading(false);
    },
    []
  );

  // Debounced so typing a name does not fire a request per keystroke — on a
  // 2G link that is the difference between usable and unusable.
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void load(page, search, grade);
      },
      search ? 350 : 0
    );

    return () => window.clearTimeout(timer);
  }, [load, page, search, grade]);

  // Reload once queued changes have reached the server.
  useEffect(() => {
    const onSynced = () => void load(page, search, grade);
    window.addEventListener("ruraledu:synced", onSynced);
    return () => window.removeEventListener("ruraledu:synced", onSynced);
  }, [load, page, search, grade]);

  const refresh = () => void load(page, search, grade);

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash(""), 4_000);
  };

  const setInactive = async (student: Student) => {
    setBusyId(student.id);
    const response = await api.patch(
      `/api/students/${student.id}`,
      { isActive: false },
      { queueOffline: true, label: `Mark ${student.name} as left` }
    );
    setBusyId(null);
    setConfirmId(null);

    if (response.success) {
      showFlash(`${student.name} has been removed from the active roster.`);
      refresh();
    } else {
      setLoadError(response.message);
    }
  };

  const remove = async (student: Student) => {
    setBusyId(student.id);
    const response = await api.delete(`/api/students/${student.id}`, {
      queueOffline: true,
      label: `Delete ${student.name}`,
    });
    setBusyId(null);
    setConfirmId(null);

    if (response.success) {
      showFlash(`${student.name} has been deleted.`);
      refresh();
    } else {
      setLoadError(response.message);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={<Users className="h-4 w-4" aria-hidden />}
        title="Student roster"
        description={
          isLoading && students.length === 0
            ? "Loading…"
            : `${meta.total} active student${meta.total === 1 ? "" : "s"}${
                fromCache ? " · showing a saved copy" : ""
              }`
        }
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            icon={<UserPlus className="h-4 w-4" aria-hidden />}
          >
            Enrol student
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        {flash ? <Alert tone="success">{flash}</Alert> : null}
        {loadError ? <Alert>{loadError}</Alert> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, roll number or guardian"
              aria-label="Search students"
              className="field-input pl-9"
            />
          </div>

          <select
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by grade"
            className="field-input sm:w-40"
          >
            <option value="">All grades</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (value) => (
                <option key={value} value={value}>
                  Grade {value}
                </option>
              )
            )}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden />}
            title={
              search || grade ? "No matching students" : "No students enrolled"
            }
            description={
              search || grade
                ? "Try a different name or grade."
                : "Add your first pupil to start keeping records."
            }
            action={
              search || grade ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setGrade("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setIsFormOpen(true);
                  }}
                  icon={<UserPlus className="h-4 w-4" aria-hidden />}
                >
                  Enrol student
                </Button>
              )
            }
          />
        ) : (
          <ul className="space-y-2">
            {students.map((student) => (
              <li
                key={student.id}
                className="rounded-xl border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]"
                    aria-hidden
                  >
                    {initialsFor(student.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {student.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
                      <span>
                        Grade {student.grade}
                        {student.section ? `-${student.section}` : ""}
                      </span>
                      {student.rollNumber ? (
                        <span>· Roll {student.rollNumber}</span>
                      ) : null}
                      {student.guardianPhone ? (
                        <a
                          href={`tel:${student.guardianPhone}`}
                          className="inline-flex items-center gap-1 hover:text-[var(--primary)] hover:underline"
                        >
                          <Phone className="h-3 w-3" aria-hidden />
                          {student.guardianPhone}
                        </a>
                      ) : null}
                    </p>
                  </div>

                  {confirmId === student.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Remove {student.name}?
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === student.id}
                        onClick={() => void setInactive(student)}
                      >
                        Mark as left
                      </Button>
                      {isAdmin ? (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyId === student.id}
                          onClick={() => void remove(student)}
                        >
                          Delete
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge tone={student.isActive ? "success" : "neutral"}>
                        {student.isActive ? "Enrolled" : "Left"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Edit ${student.name}`}
                        onClick={() => {
                          setEditing(student);
                          setIsFormOpen(true);
                        }}
                        icon={<Pencil className="h-4 w-4" aria-hidden />}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove ${student.name}`}
                        onClick={() => setConfirmId(student.id)}
                        className="text-[var(--danger)]"
                        icon={
                          isAdmin ? (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          ) : (
                            <UserRoundX className="h-4 w-4" aria-hidden />
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {meta.totalPages > 1 ? (
          <nav
            aria-label="Roster pages"
            className="flex items-center justify-between border-t border-[var(--border)] pt-4"
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                icon={<ChevronLeft className="h-4 w-4" aria-hidden />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() =>
                  setPage((current) => Math.min(meta.totalPages, current + 1))
                }
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </div>

      <StudentForm
        key={editing?.id ?? "new"}
        open={isFormOpen}
        student={editing}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        onSaved={(message) => {
          setIsFormOpen(false);
          setEditing(null);
          showFlash(message);
          refresh();
        }}
      />
    </Card>
  );
}
