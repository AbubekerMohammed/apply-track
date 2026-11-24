"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  UserCheck,
  ClipboardCheck,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export interface FocusFollowUp {
  id: string;
  contactName: string;
  company: string;
  channel: string;
  followUpDate: string | Date | null;
  response: string | null;
}

export interface FocusReferral {
  id: string;
  name: string;
  targetRole: string | null;
  priority: string;
  jobLink: string | null;
}

export interface FocusAssessment {
  id: string;
  company: string;
  role: string;
  dateApplied: string | Date;
}

interface TodaysFocusProps {
  followUpsDue: FocusFollowUp[];
  referralsNeeded: FocusReferral[];
  pendingAssessments: FocusAssessment[];
}

export function TodaysFocus({
  followUpsDue,
  referralsNeeded,
  pendingAssessments,
}: TodaysFocusProps) {
  const totalItems =
    followUpsDue.length + referralsNeeded.length + pendingAssessments.length;

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-[#11141A] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
            Tactical Dispatch
          </span>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Today&apos;s Focus
          </h2>
        </div>

        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300 self-start sm:self-auto border border-slate-200 dark:border-white/[0.08]">
          {totalItems} Action Items
        </span>
      </div>

      {/* 3 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Category 1: Follow-ups Due */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>Follow-ups Due</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {followUpsDue.length}
              </span>
            </div>

            {followUpsDue.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px]">No overdue follow-ups</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {followUpsDue.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/contacts"
                    className="p-2 rounded-md bg-white dark:bg-[#161A22] border border-slate-200/80 dark:border-white/[0.06] block hover:border-blue-400 transition-colors"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.contactName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{item.company}</span>
                      <span className="text-amber-600 dark:text-amber-400">{item.channel}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/contacts"
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]"
          >
            <span>Open contacts ledger</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category 2: Referrals Needed */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Referrals Needed</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {referralsNeeded.length}
              </span>
            </div>

            {referralsNeeded.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px]">All targets covered</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {referralsNeeded.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/targets"
                    className="p-2 rounded-md bg-white dark:bg-[#161A22] border border-slate-200/80 dark:border-white/[0.06] block hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase font-bold px-1 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {item.targetRole || "Target Company"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/targets"
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]"
          >
            <span>View target companies</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category 3: Pending Assessments */}
        <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-sky-500" />
                <span>Assessments</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {pendingAssessments.length}
              </span>
            </div>

            {pendingAssessments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px]">No pending assessments</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingAssessments.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/applications?stage=Assessment"
                    className="p-2 rounded-md bg-white dark:bg-[#161A22] border border-slate-200/80 dark:border-white/[0.06] block hover:border-sky-400 transition-colors"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.role}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{item.company}</span>
                      <span className="text-sky-600 dark:text-sky-400">OA / Test</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/applications?stage=Assessment"
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]"
          >
            <span>View assessments pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
