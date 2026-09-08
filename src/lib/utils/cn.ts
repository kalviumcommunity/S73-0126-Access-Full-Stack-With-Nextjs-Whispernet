// lib/utils/cn.ts

type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Joins conditional class names.
 *
 * Deliberately dependency-free: `clsx` is tiny but this app ships over 2G
 * connections, and every kilobyte of JavaScript is one the school pays for.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(" ");
}
