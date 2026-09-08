"use client";

import { useState } from "react";
import { api } from "@/lib/http/apiClient";
import { Alert, Button, Field, Modal } from "@/components/ui";
import { createStudentSchema } from "@/lib/validation/student";
import type { Student } from "./types";

interface StudentFormProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const EMPTY = {
  name: "",
  rollNumber: "",
  grade: "",
  section: "A",
  guardianName: "",
  guardianPhone: "",
};

function initialForm(student: Student | null) {
  if (!student) return EMPTY;

  return {
    name: student.name,
    rollNumber: student.rollNumber ?? "",
    grade: String(student.grade),
    section: student.section,
    guardianName: student.guardianName ?? "",
    guardianPhone: student.guardianPhone ?? "",
  };
}

/**
 * Enrol a new pupil or amend an existing record. Works offline via the outbox.
 *
 * The caller gives this a `key` tied to the record being edited, so opening a
 * different student remounts the form with fresh state — no reset effect, and
 * no chance of one pupil's half-typed edit leaking into another's.
 */
export function StudentForm({
  open,
  student,
  onClose,
  onSaved,
}: StudentFormProps) {
  const [form, setForm] = useState(() => initialForm(student));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const parsed = createStudentSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);

    const response = student
      ? await api.patch(`/api/students/${student.id}`, parsed.data, {
          queueOffline: true,
          label: `Update ${parsed.data.name}`,
        })
      : await api.post("/api/students", parsed.data, {
          queueOffline: true,
          label: `Enrol ${parsed.data.name}`,
        });

    setIsSaving(false);

    if (response.success) {
      onSaved(response.message);
      return;
    }

    const details = response.error?.details;
    if (Array.isArray(details)) {
      const fieldErrors: Record<string, string> = {};
      for (const item of details as { field: string; message: string }[]) {
        if (!fieldErrors[item.field]) fieldErrors[item.field] = item.message;
      }
      setErrors(fieldErrors);
    } else {
      setError(response.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? "Edit student" : "Enrol a student"}
      description={
        student
          ? "Update this pupil's record."
          : "Add a pupil to the school roster."
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{error}</Alert> : null}

        <Field label="Full name" error={errors.name} required>
          {(props) => (
            <input
              {...props}
              className="field-input"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Ananya Patil"
              maxLength={60}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Grade" error={errors.grade} required>
            {(props) => (
              <select
                {...props}
                className="field-input"
                value={form.grade}
                onChange={(event) => update("grade", event.target.value)}
              >
                <option value="">Select</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  )
                )}
              </select>
            )}
          </Field>

          <Field label="Section" error={errors.section} required>
            {(props) => (
              <select
                {...props}
                className="field-input"
                value={form.section}
                onChange={(event) => update("section", event.target.value)}
              >
                {["A", "B", "C", "D"].map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Roll number" error={errors.rollNumber}>
            {(props) => (
              <input
                {...props}
                className="field-input"
                value={form.rollNumber}
                onChange={(event) => update("rollNumber", event.target.value)}
                placeholder="07"
                maxLength={12}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guardian name" error={errors.guardianName}>
            {(props) => (
              <input
                {...props}
                className="field-input"
                value={form.guardianName}
                onChange={(event) => update("guardianName", event.target.value)}
                placeholder="Rekha Patil"
                maxLength={60}
              />
            )}
          </Field>

          <Field label="Guardian phone" error={errors.guardianPhone}>
            {(props) => (
              <input
                {...props}
                type="tel"
                className="field-input"
                value={form.guardianPhone}
                onChange={(event) =>
                  update("guardianPhone", event.target.value)
                }
                placeholder="9876543210"
              />
            )}
          </Field>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} className="flex-1">
            {student ? "Save changes" : "Enrol student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
