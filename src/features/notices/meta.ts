// features/notices/meta.ts
// Presentation metadata for notice categories and priorities.

import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  PartyPopper,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "@/components/ui";
import type {
  NoticeCategoryValue,
  NoticePriorityValue,
} from "@/lib/validation/notice";

export interface NoticeRecord {
  id: number;
  title: string;
  content: string;
  category: NoticeCategoryValue;
  priority: NoticePriorityValue;
  isPinned: boolean;
  isActive: boolean;
  authorName: string;
  publishedAt: string;
  expiresAt: string | null;
  updatedAt: string;
}

export const CATEGORY_META: Record<
  NoticeCategoryValue,
  { label: string; icon: LucideIcon }
> = {
  GENERAL: { label: "General", icon: Bell },
  ACADEMIC: { label: "Academic", icon: GraduationCap },
  EXAM: { label: "Examination", icon: ClipboardList },
  EVENT: { label: "Event", icon: PartyPopper },
  SPORTS: { label: "Sports", icon: Trophy },
  HOLIDAY: { label: "Holiday", icon: CalendarDays },
  FACILITY: { label: "Facility", icon: BookOpen },
  MEETING: { label: "Meeting", icon: Users },
};

export const PRIORITY_META: Record<
  NoticePriorityValue,
  { label: string; tone: BadgeTone }
> = {
  URGENT: { label: "Urgent", tone: "danger" },
  HIGH: { label: "Important", tone: "warning" },
  NORMAL: { label: "Notice", tone: "neutral" },
  LOW: { label: "For information", tone: "info" },
};

/**
 * Formats a publication date the way a notice board reads: recent items in
 * relative terms, older ones by date.
 */
export function formatNoticeDate(value: string): string {
  const date = new Date(value);
  const dayMs = 24 * 60 * 60 * 1000;

  const startOfDay = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / dayMs);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year:
      date.getUTCFullYear() === new Date().getUTCFullYear()
        ? undefined
        : "numeric",
  });
}

/** Days until a notice expires; `null` when it never does. */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / dayMs);
}
