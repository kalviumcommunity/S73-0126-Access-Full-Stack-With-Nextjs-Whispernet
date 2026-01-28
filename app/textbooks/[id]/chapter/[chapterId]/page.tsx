// app/textbooks/[id]/chapter/[chapterId]/page.tsx
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  ChevronLeft,
  Home,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterById, textbooks } from "@/lib/textbookData";

interface PageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export function generateStaticParams() {
  const params: { id: string; chapterId: string }[] = [];
  textbooks.forEach((book) => {
    book.chapters.forEach((chapter) => {
      params.push({
        id: book.id.toString(),
        chapterId: chapter.id.toString(),
      });
    });
  });
  return params;
}

export default async function ChapterPage({ params }: PageProps) {
  const { id, chapterId } = await params;
  const result = getChapterById(parseInt(id), parseInt(chapterId));

  if (!result) {
    notFound();
  }

  const { textbook, chapter } = result;
  const currentIndex = textbook.chapters.findIndex(
    (ch) => ch.id === chapter.id
  );
  const prevChapter =
    currentIndex > 0 ? textbook.chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < textbook.chapters.length - 1
      ? textbook.chapters[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen hero-gradient noise-overlay">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              href={`/textbooks/${textbook.id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">
                Back to {textbook.subject}
              </span>
              <span className="text-sm font-medium sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Chapter {chapter.id} of {textbook.chapters.length}
              </span>
              <Link
                href="/textbooks"
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="All Textbooks"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Chapter Header */}
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 bg-gradient-to-r ${textbook.color.bg} rounded-full text-white text-xs font-medium`}
            >
              {textbook.subject}
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {chapter.duration}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {chapter.title}
          </h1>
          <p className="text-slate-500 text-sm">From: {textbook.title}</p>
        </div>

        {/* Chapter Content */}
        <article className="glass rounded-2xl p-8 animate-slide-up prose-content">
          <div
            className="prose prose-slate max-w-none
              prose-headings:text-slate-900 prose-headings:font-bold
              prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-slate-200
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
              prose-ul:my-4 prose-ul:space-y-2
              prose-ol:my-4 prose-ol:space-y-2
              prose-li:text-slate-600
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-code:bg-slate-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-emerald-600 prose-code:text-sm
              prose-table:w-full prose-table:my-6
              prose-th:bg-slate-100 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-slate-700
              prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-slate-100 prose-td:text-slate-600
              prose-hr:my-8 prose-hr:border-slate-200"
            dangerouslySetInnerHTML={{
              __html: formatContent(chapter.content),
            }}
          />
        </article>

        {/* Chapter Navigation */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {prevChapter ? (
            <Link
              href={`/textbooks/${textbook.id}/chapter/${prevChapter.id}`}
              className="glass rounded-xl p-4 hover:bg-white/80 transition-colors group flex items-center gap-3"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all" />
              <div className="text-left">
                <p className="text-xs text-slate-500">Previous</p>
                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                  {prevChapter.title}
                </p>
              </div>
            </Link>
          ) : (
            <div></div>
          )}

          {nextChapter ? (
            <Link
              href={`/textbooks/${textbook.id}/chapter/${nextChapter.id}`}
              className="glass rounded-xl p-4 hover:bg-white/80 transition-colors group flex items-center justify-end gap-3"
            >
              <div className="text-right">
                <p className="text-xs text-slate-500">Next</p>
                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                  {nextChapter.title}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </Link>
          ) : (
            <Link
              href={`/textbooks/${textbook.id}`}
              className="glass rounded-xl p-4 hover:bg-white/80 transition-colors group flex items-center justify-end gap-3"
            >
              <div className="text-right">
                <p className="text-xs text-slate-500">Completed!</p>
                <p className="text-sm font-medium text-emerald-600">
                  Back to Chapters
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            </Link>
          )}
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

// Simple markdown-like content formatter
function formatContent(content: string): string {
  let html = content;

  // Escape HTML first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Tables (basic support)
  const tableRegex = /\|(.+)\|\n\|[-|\s]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (_, header, body) => {
    const headers = header
      .split("|")
      .filter((h: string) => h.trim())
      .map((h: string) => `<th>${h.trim()}</th>`)
      .join("");
    const rows = body
      .trim()
      .split("\n")
      .map((row: string) => {
        const cells = row
          .split("|")
          .filter((c: string) => c.trim())
          .map((c: string) => `<td>${c.trim()}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Ordered lists (numbered)
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Paragraphs - wrap remaining text
  html = html
    .split("\n\n")
    .map((block) => {
      if (
        block.trim() &&
        !block.startsWith("<h") &&
        !block.startsWith("<ul") &&
        !block.startsWith("<ol") &&
        !block.startsWith("<table") &&
        !block.startsWith("<blockquote")
      ) {
        // Check if it's just list items
        if (block.includes("<li>") && !block.includes("<ul>")) {
          return `<ul>${block}</ul>`;
        }
        if (!block.includes("<")) {
          return `<p>${block.replace(/\n/g, "<br>")}</p>`;
        }
      }
      return block;
    })
    .join("\n\n");

  // Clean up extra whitespace
  html = html.replace(/\n{3,}/g, "\n\n");

  return html;
}
