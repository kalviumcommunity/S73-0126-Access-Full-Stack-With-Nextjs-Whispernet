"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  Bell,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/http/apiClient";
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { noticeCategories } from "@/lib/validation/notice";
import type { NoticeCategoryValue } from "@/lib/validation/notice";
import {
  CATEGORY_META,
  PRIORITY_META,
  daysUntilExpiry,
  formatNoticeDate,
  type NoticeRecord,
} from "./meta";
import { NoticeEditor } from "./NoticeEditor";

interface NoticeBoardProps {
  /** Server-rendered notices, so the board is readable before JS boots. */
  initialNotices: NoticeRecord[];
}

/**
 * The interactive notice board.
 *
 * The statically-rendered list is handed in as `initialNotices` so the page is
 * useful immediately (and offline); filtering and staff editing then take over
 * on the client.
 */
export function NoticeBoard({ initialNotices }: NoticeBoardProps) {
  const { isStaff } = useAuth();
  const [notices, setNotices] = useState<NoticeRecord[]>(initialNotices);
  const [category, setCategory] = useState<NoticeCategoryValue | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editing, setEditing] = useState<NoticeRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const response = await api.get<{ notices: NoticeRecord[] }>(
      "/api/notices?limit=50"
    );
    if (response.success && response.data?.notices) {
      setNotices(response.data.notices);
    }
    setIsRefreshing(false);
  }, []);

  // Pick up notices published from another device once we reconnect.
  useEffect(() => {
    const onSynced = () => void refresh();
    window.addEventListener("ruraledu:synced", onSynced);
    return () => window.removeEventListener("ruraledu:synced", onSynced);
  }, [refresh]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notices.filter((notice) => {
      if (category !== "ALL" && notice.category !== category) return false;
      if (!term) return true;
      return (
        notice.title.toLowerCase().includes(term) ||
        notice.content.toLowerCase().includes(term) ||
        notice.authorName.toLowerCase().includes(term)
      );
    });
  }, [notices, category, search]);

  const categoriesInUse = useMemo(() => {
    const counts = new Map<NoticeCategoryValue, number>();
    for (const notice of notices) {
      counts.set(notice.category, (counts.get(notice.category) ?? 0) + 1);
    }
    return noticeCategories.filter((value) => counts.has(value));
  }, [notices]);

  const withdraw = async (notice: NoticeRecord) => {
    setBusyId(notice.id);
    const response = await api.delete(`/api/notices/${notice.id}`, {
      queueOffline: true,
      label: `Withdraw notice "${notice.title}"`,
    });

    if (response.success) {
      setNotices((current) => current.filter((n) => n.id !== notice.id));
    }
    setBusyId(null);
  };

  const togglePin = async (notice: NoticeRecord) => {
    setBusyId(notice.id);
    const response = await api.patch<NoticeRecord>(
      `/api/notices/${notice.id}`,
      { isPinned: !notice.isPinned },
      {
        queueOffline: true,
        label: `${notice.isPinned ? "Unpin" : "Pin"} notice "${notice.title}"`,
      }
    );

    if (response.success) await refresh();
    setBusyId(null);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notices"
              aria-label="Search notices"
              className="field-input pl-9"
            />
          </div>

          {isStaff ? (
            <Button
              onClick={() => {
                setEditing(null);
                setIsEditorOpen(true);
              }}
              icon={<Plus className="h-4 w-4" aria-hidden />}
            >
              Publish notice
            </Button>
          ) : null}
        </div>

        {categoriesInUse.length > 1 ? (
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by category"
          >
            <FilterChip
              active={category === "ALL"}
              onClick={() => setCategory("ALL")}
            >
              All ({notices.length})
            </FilterChip>
            {categoriesInUse.map((value) => (
              <FilterChip
                key={value}
                active={category === value}
                onClick={() => setCategory(value)}
              >
                {CATEGORY_META[value].label}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </Card>

      {/* List */}
      {isRefreshing && notices.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Card key={key} className="space-y-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="h-6 w-6" aria-hidden />}
            title={
              notices.length === 0
                ? "No notices on the board"
                : "No notices match your search"
            }
            description={
              notices.length === 0
                ? "Announcements published by the school office will appear here."
                : "Try a different word, or clear the category filter."
            }
            action={
              notices.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setCategory("ALL");
                  }}
                >
                  Clear filters
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((notice) => (
            <li key={notice.id}>
              <NoticeItem
                notice={notice}
                expanded={expanded === notice.id}
                onToggle={() =>
                  setExpanded((current) =>
                    current === notice.id ? null : notice.id
                  )
                }
                isStaff={isStaff}
                busy={busyId === notice.id}
                onEdit={() => {
                  setEditing(notice);
                  setIsEditorOpen(true);
                }}
                onWithdraw={() => void withdraw(notice)}
                onTogglePin={() => void togglePin(notice)}
              />
            </li>
          ))}
        </ul>
      )}

      {isStaff ? (
        <NoticeEditor
          key={editing?.id ?? "new"}
          open={isEditorOpen}
          notice={editing}
          onClose={() => {
            setIsEditorOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsEditorOpen(false);
            setEditing(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function NoticeItem({
  notice,
  expanded,
  onToggle,
  isStaff,
  busy,
  onEdit,
  onWithdraw,
  onTogglePin,
}: {
  notice: NoticeRecord;
  expanded: boolean;
  onToggle: () => void;
  isStaff: boolean;
  busy: boolean;
  onEdit: () => void;
  onWithdraw: () => void;
  onTogglePin: () => void;
}) {
  const meta = CATEGORY_META[notice.category];
  const priority = PRIORITY_META[notice.priority];
  const Icon = meta.icon;
  const expiresInDays = daysUntilExpiry(notice.expiresAt);

  // Paragraph breaks are meaningful in a notice; preserve them.
  const paragraphs = notice.content.split(/\n{2,}/);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-[var(--shadow)]",
        notice.isPinned && "border-[var(--primary)]"
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--muted-foreground)]"
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {notice.isPinned ? (
                <Badge tone="success">
                  <Pin className="h-3 w-3" aria-hidden />
                  Pinned
                </Badge>
              ) : null}
              <Badge tone={priority.tone}>{priority.label}</Badge>
              <Badge tone="neutral">{meta.label}</Badge>
            </div>

            <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--foreground)]">
              {notice.title}
            </h3>

            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {notice.authorName} ·{" "}
              <time dateTime={notice.publishedAt}>
                {formatNoticeDate(notice.publishedAt)}
              </time>
              {expiresInDays !== null && expiresInDays <= 7 ? (
                <>
                  {" · "}
                  <span className="text-[var(--accent)]">
                    <Clock className="mr-0.5 inline h-3 w-3" aria-hidden />
                    {expiresInDays <= 0
                      ? "Expires today"
                      : `${expiresInDays} day${expiresInDays === 1 ? "" : "s"} left`}
                  </span>
                </>
              ) : null}
            </p>

            <div
              className={cn(
                "mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted-foreground)]",
                !expanded && "line-clamp-2"
              )}
            >
              {(expanded ? paragraphs : paragraphs.slice(0, 1)).map(
                (paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                )
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {paragraphs.length > 1 || notice.content.length > 160 ? (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={expanded}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {expanded ? "Show less" : "Read full notice"}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expanded && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
              ) : null}

              {isStaff ? (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePin}
                    disabled={busy}
                    icon={<Pin className="h-3.5 w-3.5" aria-hidden />}
                  >
                    {notice.isPinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    disabled={busy}
                    icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onWithdraw}
                    loading={busy}
                    className="text-[var(--danger)]"
                    icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                  >
                    Withdraw
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
