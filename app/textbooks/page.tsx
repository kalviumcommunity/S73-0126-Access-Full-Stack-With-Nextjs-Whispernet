// app/textbooks/page.tsx
import {
  BookOpen,
  ArrowLeft,
  Download,
  Star,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { textbooks } from "@/lib/textbookData";

export default async function TextbooksPage() {
  return (
    <div className="min-h-screen hero-gradient noise-overlay">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        ></div>
        <div
          className="absolute top-3/4 left-3/4 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-4s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="badge-success">Static</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl mb-6 shadow-lg shadow-purple-500/30 relative">
            <BookOpen className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Digital <span className="gradient-text">Textbooks</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Access your learning materials offline. Download once, study
            anywhere!
          </p>
        </div>

        {/* Static Generation Badge */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-medium text-sm">
                Static Generation
              </span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Clock className="w-4 h-4" />
              <span>Built at deploy time</span>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {textbooks.map((book, index) => (
            <div
              key={book.id}
              className="glass rounded-2xl overflow-hidden card-hover animate-slide-up group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Book Cover Header */}
              <div
                className={`h-32 bg-gradient-to-br ${book.color.bg} ${book.color.shadow} relative p-6 flex items-end`}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                    {book.subject}
                  </span>
                </div>
                <h2 className="relative text-white font-bold text-lg line-clamp-2">
                  {book.title}
                </h2>
              </div>

              {/* Book Details */}
              <div className="p-6">
                <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                  {book.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{book.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>{book.downloads.toLocaleString()} downloads</span>
                  </div>
                  <span className="text-slate-400">{book.grade}</span>
                </div>

                {/* Action Button */}
                <Link
                  href={`/textbooks/${book.id}`}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm transition-all flex items-center justify-center gap-2 group-hover:border-slate-300"
                >
                  <span>Read Chapters</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-12 glass rounded-2xl p-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold mb-2">
                Static Generation Benefits
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                These textbooks are{" "}
                <strong className="text-emerald-600">
                  statically generated at build time
                </strong>
                . This means lightning-fast load times and minimal data usage —
                perfect for students in areas with limited internet
                connectivity. The content is pre-rendered and cached on CDN
                edges worldwide for instant access!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Books", value: "500+", icon: "📚" },
            { label: "Subjects", value: "12", icon: "📖" },
            { label: "Downloads", value: "50K+", icon: "⬇️" },
            { label: "Students", value: "10K+", icon: "👩‍🎓" },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass rounded-xl p-4 text-center animate-slide-up"
              style={{ animationDelay: `${(index + 5) * 100}ms` }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-900">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>RuralEdu • Offline-First Education Platform</p>
        </div>
      </footer>
    </div>
  );
}
