import Link from "next/link";
import {
  BookOpen,
  Wifi,
  WifiOff,
  Smartphone,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Globe,
  Users,
  BarChart3,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-50"></div>
                <div className="relative flex items-center justify-center w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  RuralEdu
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 ml-2 px-2 py-0.5 bg-emerald-100 rounded-full">
                  v1.0
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm flex items-center gap-2"
              >
                Get Started
                <Sparkles className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient noise-overlay pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-emerald-200 text-emerald-700 rounded-full text-sm font-medium mb-8 shadow-lg shadow-emerald-100">
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <WifiOff className="w-4 h-4" />
              Built for Low-Bandwidth Environments
            </div>

            {/* Heading */}
            <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              Education That Works
              <span className="block mt-2 gradient-text">Even Offline</span>
            </h1>

            {/* Subheading */}
            <p className="animate-slide-up stagger-1 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              RuralEdu is an offline-first learning management system designed
              for rural schools with limited internet connectivity.
              <span className="font-semibold text-slate-700">
                {" "}
                Load once, use forever.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group btn-primary text-base flex items-center gap-2 px-8 py-4"
              >
                Start Using RuralEdu
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary text-base flex items-center gap-2 px-8 py-4"
              >
                <Users className="w-5 h-5" />
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in stagger-3 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>100% Free & Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Works on 2G Networks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>No Installation Required</span>
              </div>
            </div>
          </div>

          {/* Floating illustration */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10 pointer-events-none"></div>
            <div className="animate-float mx-auto max-w-4xl bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 mx-auto max-w-sm">
                  <div className="bg-white rounded-md px-3 py-1.5 text-xs text-slate-500 text-center">
                    ruraledu.app/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Students",
                      value: "1,234",
                      color: "emerald",
                      icon: Users,
                    },
                    {
                      label: "Teachers",
                      value: "48",
                      color: "blue",
                      icon: BookOpen,
                    },
                    {
                      label: "Attendance",
                      value: "94%",
                      color: "amber",
                      icon: BarChart3,
                    },
                    {
                      label: "Response",
                      value: "5ms",
                      color: "purple",
                      icon: Zap,
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`bg-white p-4 rounded-xl border border-slate-200 stagger-${i + 1} animate-slide-up`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center mb-3`}
                      >
                        <stat.icon
                          className={`w-5 h-5 text-${stat.color}-600`}
                        />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Choose RuralEdu?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Designed from the ground up to solve the unique challenges of
              digital education in rural communities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: WifiOff,
                title: "Offline-First",
                description:
                  "Works without internet once loaded. Perfect for areas with intermittent connectivity.",
                color: "emerald",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Redis caching ensures instant responses. Optimized for slow 2G/3G networks.",
                color: "blue",
                gradient: "from-blue-500 to-indigo-500",
              },
              {
                icon: Smartphone,
                title: "Mobile-Ready PWA",
                description:
                  "Install on any device like a native app. Works on low-end smartphones.",
                color: "amber",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: Wifi,
                title: "Low Bandwidth",
                description:
                  "Minimal data transfer. Pages under 50KB. No heavy frameworks or images.",
                color: "purple",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Secure Auth",
                description:
                  "JWT-based authentication with role-based access for teachers and admins.",
                color: "red",
                gradient: "from-red-500 to-rose-500",
              },
              {
                icon: Globe,
                title: "Simple & Accessible",
                description:
                  "High-contrast, minimalist design. Easy for first-time users and educators.",
                color: "cyan",
                gradient: "from-cyan-500 to-blue-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group card-hover bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300"
              >
                <div
                  className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity`}
                  ></div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50KB", label: "Average Page Size" },
              { value: "5ms", label: "Cached Response" },
              { value: "100%", label: "Offline Capable" },
              { value: "2G+", label: "Network Support" },
            ].map((stat, i) => (
              <div key={i} className="p-6">
                <p className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Rural Education?
          </h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
            Join schools across the country in bringing digital learning to
            students who need it most. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group bg-white text-emerald-700 font-semibold px-8 py-4 rounded-xl hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-700/30 flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="text-white/90 hover:text-white font-medium px-8 py-4 rounded-xl border-2 border-white/30 hover:border-white/50 transition-all flex items-center gap-2"
            >
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">RuralEdu</span>
                <p className="text-slate-400 text-sm">Offline-First Learning</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/notices"
                className="hover:text-white transition-colors"
              >
                Notices
              </Link>
              <Link
                href="/textbooks"
                className="hover:text-white transition-colors"
              >
                Textbooks
              </Link>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 RuralEdu (Whispernet). Built for rural schools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
