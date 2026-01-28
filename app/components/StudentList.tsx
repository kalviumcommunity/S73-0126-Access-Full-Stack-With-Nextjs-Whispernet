"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { z } from "zod";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  UserPlus,
  Search,
  Users,
  Trash2,
} from "lucide-react";

// Types
interface Student {
  id: number;
  name: string;
  grade: number;
  section: string | null;
}

interface StudentsResponse {
  students: Student[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FieldError {
  field: string;
  message: string;
}

// Zod Schema (matching backend)
const studentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  grade: z
    .number({ message: "Grade must be a number" })
    .min(1, "Grade must be at least 1")
    .max(12, "Grade cannot be higher than 12")
    .int("Grade must be a whole number"),
  section: z
    .string()
    .length(1, "Section must be a single character (e.g., 'A')")
    .optional()
    .or(z.literal("")),
});

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative glass rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Table Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 glass rounded-xl animate-pulse"
        >
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}

// Empty State
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-4 border border-emerald-200">
        <Users className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        No students found
      </h3>
      <p className="text-slate-600 mb-6">
        Get started by adding your first student.
      </p>
      <button onClick={onAddClick} className="btn-primary">
        <Plus className="w-4 h-4" />
        Add Student
      </button>
    </div>
  );
}

// Props interface
interface StudentListProps {
  onStudentChange?: () => void;
}

// Main StudentList Component
export default function StudentList({ onStudentChange }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    section: "",
  });
  const [formErrors, setFormErrors] = useState<FieldError[]>([]);
  const [submitError, setSubmitError] = useState("");

  // Fetch students
  const fetchStudents = useCallback(async (page = 1) => {
    setIsLoading(true);

    const response = await api.get<StudentsResponse>(
      `/api/students?page=${page}&limit=10`
    );

    if (response.success && response.data) {
      setStudents(response.data.students);
      setMeta(response.data.meta);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchStudents();
    })();
  }, [fetchStudents]);

  // Handle form change
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user types
    setFormErrors((prev) => prev.filter((err) => err.field !== name));
  };

  // Validate and submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitError("");

    // Prepare data (convert grade to number)
    const dataToValidate = {
      name: formData.name.trim(),
      grade: formData.grade ? parseInt(formData.grade, 10) : undefined,
      section: formData.section.trim() || undefined,
    };

    // Client-side Zod validation
    const result = studentSchema.safeParse(dataToValidate);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path[0] as string,
        message: issue.message,
      }));
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // API call
    const response = await api.post<Student>("/api/students", result.data);

    if (response.success) {
      // Refresh list and close modal
      await fetchStudents(meta.page);
      setIsModalOpen(false);
      setFormData({ name: "", grade: "", section: "" });
      // Notify parent that student data changed
      onStudentChange?.();
    } else {
      // Handle backend validation errors
      if (response.error?.details && Array.isArray(response.error.details)) {
        setFormErrors(response.error.details as FieldError[]);
      } else {
        setSubmitError(response.message || "Failed to add student");
      }
    }

    setIsSubmitting(false);
  };

  // Get field error
  const getFieldError = (field: string) =>
    formErrors.find((err) => err.field === field)?.message;

  // Handle delete student
  const handleDelete = async (studentId: number) => {
    setDeletingId(studentId);

    const response = await api.delete(`/api/students/${studentId}`);

    if (response.success) {
      // Refresh list
      await fetchStudents(meta.page);
      // Notify parent that student data changed
      onStudentChange?.();
    }

    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  // Filtered students (client-side search)
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass rounded-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Student Directory
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {meta.total} student{meta.total !== 1 ? "s" : ""} enrolled
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6">
        {isLoading ? (
          <TableSkeleton />
        ) : students.length === 0 ? (
          <EmptyState onAddClick={() => setIsModalOpen(true)} />
        ) : (
          <>
            {/* Responsive Table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="pb-4 pl-4">Name</th>
                    <th className="pb-4">Grade</th>
                    <th className="pb-4">Section</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-emerald-500/20">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        Grade {student.grade}
                      </td>
                      <td className="py-4 text-slate-600">
                        {student.section || "-"}
                      </td>
                      <td className="py-4">
                        <span className="badge-success">Active</span>
                      </td>
                      <td className="py-4 pr-4">
                        {deleteConfirmId === student.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(student.id)}
                              disabled={deletingId === student.id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {deletingId === student.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (visible on small screens) */}
            <div className="sm:hidden space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 bg-white rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {student.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        Grade {student.grade}
                        {student.section && ` • Section ${student.section}`}
                      </p>
                    </div>
                    <span className="badge-success shrink-0">Active</span>
                  </div>
                  {/* Delete button for mobile */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    {deleteConfirmId === student.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deletingId === student.id}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === student.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(student.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchStudents(meta.page - 1)}
                    disabled={meta.page === 1}
                    className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fetchStudents(meta.page + 1)}
                    disabled={meta.page === meta.totalPages}
                    className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormErrors([]);
          setSubmitError("");
        }}
        title="Add New Student"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Submit Error */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter student name"
              className={`input-modern ${
                getFieldError("name")
                  ? "border-red-500/50 focus:ring-red-500/50"
                  : ""
              }`}
            />
            {getFieldError("name") && (
              <p className="mt-2 text-sm text-red-400">
                {getFieldError("name")}
              </p>
            )}
          </div>

          {/* Grade Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleFormChange}
              className={`input-modern ${
                getFieldError("grade")
                  ? "border-red-500/50 focus:ring-red-500/50"
                  : ""
              }`}
            >
              <option value="">Select grade</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Grade {i + 1}
                </option>
              ))}
            </select>
            {getFieldError("grade") && (
              <p className="mt-2 text-sm text-red-400">
                {getFieldError("grade")}
              </p>
            )}
          </div>

          {/* Section Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Section{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleFormChange}
              placeholder="e.g., A, B, C"
              maxLength={1}
              className={`input-modern ${
                getFieldError("section")
                  ? "border-red-500/50 focus:ring-red-500/50"
                  : ""
              }`}
            />
            {getFieldError("section") && (
              <p className="mt-2 text-sm text-red-400">
                {getFieldError("section")}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
