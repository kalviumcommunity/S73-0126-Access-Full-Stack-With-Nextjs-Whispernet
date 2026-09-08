import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { NoticeBoard } from "@/features/notices/NoticeBoard";
import type { NoticeRecord } from "@/features/notices/meta";

/**
 * Incremental Static Regeneration.
 *
 * The board is rendered once and served from cache to everyone; it refreshes at
 * most every five minutes on its own, and `revalidatePath("/notices")` in the
 * notices API pushes a new version out the instant staff publish something. So
 * readers get a static-page-sized download without ever seeing a stale board.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Notice board",
  description:
    "Announcements from the school office — examinations, meetings, holidays and events.",
};

async function getNotices(): Promise<NoticeRecord[]> {
  const now = new Date();

  const notices = await prisma.notice.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      priority: true,
      isPinned: true,
      isActive: true,
      authorName: true,
      publishedAt: true,
      expiresAt: true,
      updatedAt: true,
    },
  });

  // Dates are serialised here rather than in the client component so the
  // boundary stays plain JSON.
  return notices.map((notice) => ({
    ...notice,
    publishedAt: notice.publishedAt.toISOString(),
    expiresAt: notice.expiresAt?.toISOString() ?? null,
    updatedAt: notice.updatedAt.toISOString(),
  }));
}

export default async function NoticesPage() {
  let notices: NoticeRecord[] = [];
  let loadFailed = false;

  try {
    notices = await getNotices();
  } catch {
    // A database outage must not take the whole board down: render the shell
    // and let the client retry, so a cached copy can still be shown offline.
    loadFailed = true;
  }

  const pinned = notices.filter((notice) => notice.isPinned).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Notice board
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Announcements from the school office. Anyone can read this page —
              no account needed.
            </p>
          </div>
        </div>

        {notices.length > 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {notices.length} notice{notices.length === 1 ? "" : "s"} on the
            board
            {pinned > 0 ? ` · ${pinned} pinned` : ""}
          </p>
        ) : null}
      </header>

      {loadFailed ? (
        <div
          role="alert"
          className="rounded-xl border border-[#f3ddbf] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#8a3f07]"
        >
          The notice board could not be loaded from the school server. If you
          have opened this page before, a saved copy is shown below.
        </div>
      ) : null}

      <NoticeBoard initialNotices={notices} />
    </div>
  );
}
