import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  Briefcase,
  ArrowRight,
  Mail,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  Building2,
  ChevronRight,
  TrendingUp,
  Target,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                ApplyTrack
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <a href="#pipeline" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Pipeline
              </a>
              <a href="#automation" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Email Sync
              </a>
              <a href="#referrals" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Referral Network
              </a>
              <a href="#analytics" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Daily Goals
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-medium px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-medium px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-[1.12]">
            Track every job application from first outreach to signed offer.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            ApplyTrack connects with Gmail and Outlook to automatically capture confirmation
            emails, coding assessments, and interview invites. Organize your search pipeline,
            hit daily volume goals, and secure referrals with structured follow-ups.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-xs"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span>Open Demo Workspace</span>
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Direct Gmail & Outlook OAuth
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              100% User Data Scoped
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Kanban & CSV Export
            </span>
          </div>

          {/* Authentic Product UI Window Preview */}
          <div className="pt-8 sm:pt-12 text-left">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
              {/* Window Controls Bar */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1017] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="ml-3 text-xs font-mono text-slate-400">
                    app.applytrack.com/applications
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Inbox Sync Active
                  </span>
                </div>
              </div>

              {/* Product Canvas Content */}
              <div className="p-4 sm:p-6 space-y-5">
                {/* Search & Stats Filter Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        readOnly
                        value="Senior Engineer"
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 w-48 sm:w-64"
                      />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                      Stage: All Active (24)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Daily Goal:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      8 / 10 applied
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium text-[11px]">
                      80%
                    </span>
                  </div>
                </div>

                {/* Pipeline Board Columns Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Column 1: Applied */}
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Applied
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        14
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Stripe
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          Gmail Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Senior Frontend Engineer
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>$180k - $210k</span>
                        <span>2d ago</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Figma
                        </span>
                        <span className="text-[10px] text-slate-400">Referred</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Design Systems Engineer
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>San Francisco</span>
                        <span>4d ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Assessment */}
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Assessment
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        3
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Datadog
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                          HackerRank
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Distributed Systems Engineer
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>Due in 3 days</span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Interviewing */}
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Interviewing
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        4
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Airbnb
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          Round 3
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Staff Software Engineer
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>System Design</span>
                        <span>Tomorrow 10 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Offer */}
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Offer
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                        1
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Vercel
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Offer Received
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Solutions Architect
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          $195,000 + Equity
                        </span>
                        <span className="text-slate-400">Decide Fri</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Breakdown 1: Inbox Automation */}
        <section id="automation" className="border-t border-slate-200 dark:border-slate-800 py-20 bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                  Inbox Integration
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Never manually log an application confirmation again.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect your personal or search-specific Gmail and Outlook accounts. ApplyTrack
                  continuously extracts company names, roles, assessment invites, interview
                  confirmations, and rejection updates without reading your private threads.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Read-only OAuth:</strong> We only read job-related subject lines and
                      structured snippets, never storing email bodies.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Zero duplicate clutter:</strong> Multi-inbox deduplication ensures applications
                      are linked to the same pipeline record.
                    </p>
                  </div>
                </div>
              </div>

              {/* Realistic Email-to-Pipeline Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-slate-900 dark:text-white">Gmail API Event</span>
                  </div>
                  <span className="text-slate-400">2 minutes ago</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    no-reply@stripe.com: Application received for Senior Frontend Engineer
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    &ldquo;Thanks for applying to Stripe! Our engineering recruiting team has received your application...&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <span>Automatically classified as: Application Confirmation</span>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                      New Application Record Created
                    </span>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      Stripe &bull; Senior Frontend Engineer &bull; Stage: Applied
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white font-medium">
                    In Pipeline
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Breakdown 2: Referrals & Outreach */}
        <section id="referrals" className="border-t border-slate-200 dark:border-slate-800 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Checklist & Outreach Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs order-2 md:order-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Target: Anthropic
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    High Priority
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Find contact at Anthropic (Elena Rostova, Staff Eng)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Send outreach message via LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Follow-up reminder due in 2 days</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700" />
                    <span>Secure referral & submit application</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Duplicate outreach detection active</span>
                  <span className="font-semibold text-slate-900 dark:text-white">1 Outreach Logged</span>
                </div>
              </div>

              <div className="space-y-4 order-1 md:order-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                  Targets & Contacts
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Stop applying cold. Secure high-leverage referrals.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Track dream companies before you apply. Organize company targets by priority,
                  store mutual contacts with direct LinkedIn links, and automatically schedule
                  7-day follow-up reminders so promising leads never go cold.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Duplicate outreach alerts:</strong> Avoid awkward double-messages by
                      warning before contacting the same person twice.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Today&apos;s Focus dashboard:</strong> Critical follow-ups surface directly on
                      your daily dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Breakdown 3: Daily Goals & Analytics */}
        <section id="analytics" className="border-t border-slate-200 dark:border-slate-800 py-20 bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
              Discipline & Velocity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Turn your job search into a measurable numbers game.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Job hunting requires daily consistency. Set your daily target in Settings, keep your
              streak alive, and watch your interview conversion funnel clarify where to double down.
            </p>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Daily Goal Ring & Streak</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  12-Day Streak
                </p>
                <p className="text-xs text-slate-500">
                  Target configured to 10 applications per day. Live progress ring updates automatically.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Response Rate Benchmark</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  28.4% Heard Back
                </p>
                <p className="text-xs text-slate-500">
                  Track how many applications turn into assessments and recruiter screens vs ghosted.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Auto-Ghost Management</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  30-Day Auto Scan
                </p>
                <p className="text-xs text-slate-500">
                  Applications without responses after 30 days are cleanly moved to Ghosted, keeping pipelines accurate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-slate-200 dark:border-slate-800 py-16 text-center space-y-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready to take control of your job search?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create a free account, connect your email, and have your complete search pipeline organized in under two minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-sm transition-colors shadow-xs"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0b0f17]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-[10px] font-bold">
              A
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">ApplyTrack</span>
            <span className="text-slate-400">&bull; Smart Multi-User Job Application Tracker</span>
          </div>
          <div>
            Built with Next.js App Router, TypeScript, Tailwind, PostgreSQL & Prisma
          </div>
        </div>
      </footer>
    </div>
  );
}
