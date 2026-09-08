"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/http/apiClient";
import { Alert, Button, Field, Modal } from "@/components/ui";
import {
  createNoticeSchema,
  noticeCategories,
  noticePriorities,
} from "@/lib/validation/notice";
import { CATEGORY_META, PRIORITY_META, type NoticeRecord } from "./meta";

interface NoticeEditorProps {
  open: boolean;
  notice: NoticeRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

type FormState = {
  title: string;
  content: string;
  category: string;
  priority: string;
  authorName: string;
  isPinned: boolean;
  expiresAt: string;
};

const EMPTY: FormState = {
  title: "",
  content: "",
  category: "GENERAL",
  priority: "NORMAL",
  authorName: "",
  isPinned: false,
  expiresAt: "",
};

function initialForm(
  notice: NoticeRecord | null,
  defaultAuthor: string
): FormState {
  if (!notice) return { ...EMPTY, authorName: defaultAuthor };

  return {
    title: notice.title,
    content: notice.content,
    category: notice.category,
    priority: notice.priority,
    authorName: notice.authorName,
    isPinned: notice.isPinned,
    expiresAt: notice.expiresAt
      ? new Date(notice.expiresAt).toISOString().slice(0, 10)
      : "",
  };
}

/**
 * Publish or amend a notice. Queues the write when the device is offline.
 *
 * The caller keys this component on the notice being edited, so switching
 * notices remounts it with fresh state rather than resetting in an effect.
 */
export function NoticeEditor({
  open,
  notice,
  onClose,
  onSaved,
}: NoticeEditorProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(() =>
    initialForm(notice, user?.name ?? "School Office")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [queuedMessage, setQueuedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setQueuedMessage("");

    const parsed = createNoticeSchema.safeParse(form);
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

    const response = notice
      ? await api.patch(`/api/notices/${notice.id}`, parsed.data, {
          queueOffline: true,
          label: `Update notice "${parsed.data.title}"`,
        })
      : await api.post("/api/notices", parsed.data, {
          queueOffline: true,
          label: `Publish notice "${parsed.data.title}"`,
        });

    setIsSaving(false);

    if (response.success) {
      if (response.meta.source === "queued") {
        // Keep the dialog open just long enough to say where the notice went.
        setQueuedMessage(response.message);
        window.setTimeout(onSaved, 1_200);
      } else {
        onSaved();
      }
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
      setSubmitError(response.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={notice ? "Edit notice" : "Publish a notice"}
      description={
        notice
          ? "Changes appear on the board as soon as they are saved."
          : "This will appear on the school notice board immediately."
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {submitError ? <Alert>{submitError}</Alert> : null}
        {queuedMessage ? <Alert tone="success">{queuedMessage}</Alert> : null}

        <Field label="Title" error={errors.title} required>
          {(props) => (
            <input
              {...props}
              className="field-input"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Half-yearly examination timetable released"
              maxLength={120}
            />
          )}
        </Field>

        <Field
          label="Notice"
          error={errors.content}
          hint="Leave a blank line between paragraphs."
          required
        >
          {(props) => (
            <textarea
              {...props}
              className="field-input min-h-40 resize-y leading-relaxed"
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
              placeholder="Write the announcement as it should appear on the board…"
              maxLength={4000}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category} required>
            {(props) => (
              <select
                {...props}
                className="field-input"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {noticeCategories.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_META[value].label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Priority" error={errors.priority} required>
            {(props) => (
              <select
                {...props}
                className="field-input"
                value={form.priority}
                onChange={(event) => update("priority", event.target.value)}
              >
                {noticePriorities.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_META[value].label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Issued by" error={errors.authorName} required>
            {(props) => (
              <input
                {...props}
                className="field-input"
                value={form.authorName}
                onChange={(event) => update("authorName", event.target.value)}
                placeholder="Examination Cell"
                maxLength={80}
              />
            )}
          </Field>

          <Field
            label="Remove from board on"
            error={errors.expiresAt}
            hint="Leave blank to keep it up indefinitely."
          >
            {(props) => (
              <input
                {...props}
                type="date"
                className="field-input"
                value={form.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
              />
            )}
          </Field>
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(event) => update("isPinned", event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            <span className="font-medium text-[var(--foreground)]">
              Pin to the top of the board
            </span>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              Use for notices everyone must see, such as examination dates.
            </span>
          </span>
        </label>

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
            {notice ? "Save changes" : "Publish notice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
