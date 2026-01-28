// 1. Revalidate this segment every 60 seconds
export const revalidate = 60;

import {
  Bell,
  Clock,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Zap,
  Calendar,
  GraduationCap,
  Trophy,
  BookOpen,
  Users,
} from "lucide-react";
import Link from "next/link";

// Static school announcements data
const notices = [
  {
    id: 1,
    title: "Annual Day Celebration 2026",
    author: "Principal Mrs. Sharma",
    email: "principal@ruraledu.org",
    body: "We are excited to announce our Annual Day celebration on February 15th, 2026. Students are encouraged to participate in cultural programs, dance performances, and drama. Parents are cordially invited to attend the event starting at 10:00 AM in the school auditorium.",
    category: "event",
    date: "Jan 27, 2026",
    priority: "high",
  },
  {
    id: 2,
    title: "Mid-Term Examination Schedule",
    author: "Examination Cell",
    email: "exams@ruraledu.org",
    body: "Mid-term examinations for all classes will be conducted from February 10-20, 2026. The detailed timetable has been shared with class teachers. Students are advised to collect their hall tickets from the office by February 5th.",
    category: "academic",
    date: "Jan 26, 2026",
    priority: "high",
  },
  {
    id: 3,
    title: "Science Fair Registration Open",
    author: "Science Department",
    email: "science@ruraledu.org",
    body: "Registrations are now open for the Inter-School Science Fair 2026. Students from grades 6-12 can participate individually or in teams of up to 3 members. Last date for registration is February 1st. Contact your science teacher for project guidelines.",
    category: "competition",
    date: "Jan 25, 2026",
    priority: "medium",
  },
  {
    id: 4,
    title: "Library Hours Extended",
    author: "Librarian Mr. Patel",
    email: "library@ruraledu.org",
    body: "Good news for book lovers! The school library will now remain open until 5:30 PM on weekdays. New arrivals include books on robotics, environmental science, and regional literature. Students can issue up to 3 books at a time.",
    category: "facility",
    date: "Jan 24, 2026",
    priority: "low",
  },
  {
    id: 5,
    title: "Parent-Teacher Meeting",
    author: "Academic Coordinator",
    email: "academics@ruraledu.org",
    body: "The quarterly Parent-Teacher Meeting is scheduled for Saturday, February 8th, 2026. Parents can discuss their child's academic progress and attendance with respective class teachers. Timing: 9:00 AM to 1:00 PM.",
    category: "meeting",
    date: "Jan 23, 2026",
    priority: "medium",
  },
  {
    id: 6,
    title: "Sports Day Trials",
    author: "Physical Education Dept",
    email: "sports@ruraledu.org",
    body: "Selection trials for the upcoming Inter-District Sports Championship will be held from January 30th to February 2nd. Events include athletics, cricket, kabaddi, and volleyball. Interested students must register with the PE teacher by January 29th.",
    category: "sports",
    date: "Jan 22, 2026",
    priority: "medium",
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "event":
      return Calendar;
    case "academic":
      return GraduationCap;
    case "competition":
      return Trophy;
    case "facility":
      return BookOpen;
    case "meeting":
      return Users;
    case "sports":
      return Trophy;
    default:
      return Bell;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "event":
      return "from-purple-400 to-pink-500";
    case "academic":
      return "from-blue-400 to-cyan-500";
    case "competition":
      return "from-amber-400 to-orange-500";
    case "facility":
      return "from-emerald-400 to-teal-500";
    case "meeting":
      return "from-indigo-400 to-purple-500";
    case "sports":
      return "from-rose-400 to-red-500";
    default:
      return "from-slate-400 to-slate-500";
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        text: "Important",
        class: "bg-red-100 text-red-700 border-red-200",
      };
    case "medium":
      return {
        text: "New",
        class: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "low":
      return {
        text: "Info",
        class: "bg-blue-100 text-blue-700 border-blue-200",
      };
    default:
      return {
        text: "Notice",
        class: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
};

export default async function NoticesPage() {
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen hero-gradient noise-overlay">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
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
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Auto-updates every 60s</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-amber-500/30 relative">
            <Bell className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            School <span className="gradient-text">Announcements</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Stay updated with the latest notices and announcements from your
            school
          </p>
        </div>

        {/* ISR Badge */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium text-sm">
                ISR Mode
              </span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Clock className="w-4 h-4" />
              <span>Generated at {currentTime}</span>
            </div>
          </div>
        </div>

        {/* Notices Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice, index) => {
            const IconComponent = getCategoryIcon(notice.category);
            const colorClass = getCategoryColor(notice.category);
            const badge = getPriorityBadge(notice.priority);

            return (
              <div
                key={notice.id}
                className="glass rounded-2xl p-6 card-hover animate-slide-up group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Notice Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-slate-900 font-semibold truncate">
                      {notice.author}
                    </h3>
                    <p className="text-slate-500 text-xs truncate">
                      {notice.email}
                    </p>
                  </div>
                </div>

                {/* Notice Content */}
                <div className="mb-4">
                  <h4 className="text-slate-800 font-medium mb-2 line-clamp-2">
                    {notice.title}
                  </h4>
                  <p className="text-slate-600 text-sm line-clamp-3">
                    {notice.body}
                  </p>
                </div>

                {/* Notice Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.class}`}
                  >
                    {badge.text}
                  </span>
                  <span className="text-xs text-slate-500">{notice.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-12 glass rounded-2xl p-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold mb-2">
                How ISR Works
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This page uses{" "}
                <strong className="text-emerald-600">
                  Incremental Static Regeneration (ISR)
                </strong>
                . The content is statically generated and cached, then
                automatically revalidated every 60 seconds. This provides the
                speed of static pages with the freshness of dynamic content —
                perfect for low-bandwidth environments!
              </p>
            </div>
          </div>
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
