import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Target, Briefcase, BarChart3, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-blue-600 dark:text-blue-400">
              ApplyTrack
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Smart Multi-User Job Application Tracker</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl mx-auto leading-tight">
          Supercharge your job search with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            ApplyTrack
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Automate email detection from Gmail & Outlook, track applications across
          every pipeline stage, hit daily application goals, and secure referrals
          with structured outreach.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-102"
          >
            <span>Start Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Sign In / Demo Login</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-12">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Email Auto-Detection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Syncs with Gmail & Outlook to extract applications, assessments, and interview invites.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Pipeline & Kanban
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track stages from Applied to Interview and Offer with drag-and-drop workflow.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Target & Referrals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organize target companies, log contact outreach, and manage referral checklists.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Daily Goals & Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Streak counter, daily goal rings, response rate metrics, and funnel analytics.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        ApplyTrack • Built with Next.js App Router, Tailwind, PostgreSQL & Prisma
      </footer>
    </div>
  );
}
