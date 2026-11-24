"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  Award,
  Video,
  ClipboardCheck,
  PhoneCall,
  XCircle,
  Ghost,
  ArrowUpRight,
} from "lucide-react";

export interface DashboardStats {
  applied: number;
  heardBack: number;
  assessments: number;
  recruiterCalls: number;
  interviews: number;
  offers: number;
  rejections: number;
  ghosted: number;
  responseRate: number;
}

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const activeInFlight = stats.interviews + stats.recruiterCalls + stats.assessments;

  return (
    <div className="space-y-3 font-sans">
      {/* Primary Telemetry Grid: 3 Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Total Volume */}
        <Link
          href="/applications"
          className="p-4 rounded-xl bg-white dark:bg-[#11141A] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20 transition-all shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              Total Applications
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.applied}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              submitted
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.heardBack} received replies
          </div>
        </Link>

        {/* Metric 2: Response Rate */}
        <Link
          href="/applications"
          className="p-4 rounded-xl bg-white dark:bg-[#11141A] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20 transition-all shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              Response Conversion
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Benchmark 15%</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {stats.responseRate}%
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              response rate
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Based on {stats.applied} tracked applications
          </div>
        </Link>

        {/* Metric 3: Active Pipeline in Flight */}
        <Link
          href="/applications?stage=Interviewing"
          className="p-4 rounded-xl bg-white dark:bg-[#11141A] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20 transition-all shadow-2xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              Active Pipeline
            </span>
            {stats.offers > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Award className="w-2.5 h-2.5" />
                <span>{stats.offers} OFFER</span>
              </span>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {activeInFlight}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              in active progress
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.interviews} interviews · {stats.recruiterCalls} screens · {stats.assessments} OAs
          </div>
        </Link>
      </div>

      {/* Stage Breakdown Ledger: Precision Pipeline Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {/* Assessment */}
        <Link
          href="/applications?stage=Assessment"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-sky-400 dark:hover:border-sky-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>Assessments</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.assessments}
            </span>
          </div>
        </Link>

        {/* Recruiter Calls */}
        <Link
          href="/applications?stage=Recruiter Call"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-violet-400 dark:hover:border-violet-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span>Screens</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.recruiterCalls}
            </span>
          </div>
        </Link>

        {/* Interviewing */}
        <Link
          href="/applications?stage=Interviewing"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-amber-400 dark:hover:border-amber-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Interviews</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.interviews}
            </span>
          </div>
        </Link>

        {/* Offers */}
        <Link
          href="/applications?stage=Offer"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Offers</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.offers}
            </span>
          </div>
        </Link>

        {/* Rejections */}
        <Link
          href="/applications?stage=Rejected"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Rejections</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.rejections}
            </span>
          </div>
        </Link>

        {/* Ghosted */}
        <Link
          href="/applications?stage=Ghosted"
          className="p-3 rounded-lg bg-white dark:bg-[#11141A] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Ghosted</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.ghosted}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
