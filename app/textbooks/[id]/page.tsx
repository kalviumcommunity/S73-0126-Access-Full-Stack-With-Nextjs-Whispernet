// app/textbooks/[id]/page.tsx
import {
  BookOpen,
  ArrowLeft,
  Clock,
  ChevronRight,
  Download,
  Star,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTextbookById, textbooks } from "@/lib/textbookData";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return textbooks.map((book) => ({
    id: book.id.toString(),
  }));
}

export default async function TextbookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const textbook = getTextbookById(parseInt(id));

  if (!textbook) {
    notFound();
  }

  return (
    <div className="min-h-screen hero-gradient noise-overlay">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href="/textbooks"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Textbooks</span>
            </Link>
            <span
              className={`px-3 py-1 bg-gradient-to-r ${textbook.color.bg} rounded-full text-white text-xs font-medium`}
            >
              {textbook.subject}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="animate-fade-in mb-10">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${textbook.color.bg} rounded-2xl mb-6 shadow-lg ${textbook.color.shadow}`}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {textbook.title}
          </h1>
          <p className="text-slate-600 text-lg mb-4">{textbook.description}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {textbook.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {textbook.downloads.toLocaleString()} downloads
            </span>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-xs font-medium">
              {textbook.grade}
            </span>
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Chapters
          </h2>
          {textbook.chapters.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={`/textbooks/${textbook.id}/chapter/${chapter.id}`}
              className="glass rounded-2xl p-6 flex items-center justify-between group card-hover animate-slide-up block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${textbook.color.bg} rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${textbook.color.shadow} group-hover:scale-110 transition-transform`}
                >
                  {chapter.id}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {chapter.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{chapter.duration}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Navigation to other books */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            More Textbooks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {textbooks
              .filter((b) => b.id !== textbook.id)
              .slice(0, 4)
              .map((book) => (
                <Link
                  key={book.id}
                  href={`/textbooks/${book.id}`}
                  className="glass rounded-xl p-4 text-center hover:bg-white/80 transition-colors group"
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-br ${book.color.bg} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2">
                    {book.subject}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>RuralEdu • Offline-First Education Platform</p>
        </div>
      </footer>
    </div>
  );
}
