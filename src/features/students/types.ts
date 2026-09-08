// features/students/types.ts

export interface Student {
  id: number;
  name: string;
  rollNumber: string | null;
  grade: number;
  section: string;
  guardianName: string | null;
  guardianPhone: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentListResponse {
  students: Student[];
  meta: ListMeta;
}

/** Two-letter monogram for the roster avatar. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
