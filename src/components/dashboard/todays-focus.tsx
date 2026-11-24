"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  UserCheck,
  ClipboardCheck,
  Send,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
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
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today&apos;s Focus
            </h2>
            <p className="text-xs text-slate-400">
              Priority actions: follow-ups, referrals, and pending assessments
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 self-start sm:self-auto border border-amber-200/60 dark:border-amber-900/40">
          {totalItems} Action Items
        </span>
      </div>

      {/* 3 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category 1: Follow-ups Due */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Follow-ups Due</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {followUpsDue.length}
              </span>
            </div>

            {followUpsDue.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>No overdue follow-ups!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {followUpsDue.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/contacts"
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 block hover:border-blue-400 transition-colors"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.contactName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{item.company}</span>
                      <span className="text-amber-600 font-medium">{item.channel}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/contacts"
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-800"
          >
            <span>View contacts & outreaches</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category 2: Referrals Needed */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Referrals Needed</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {referralsNeeded.length}
              </span>
            </div>

            {referralsNeeded.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>All targets have referrals!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {referralsNeeded.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/targets"
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 block hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.targetRole || "Target Company"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/targets"
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-800"
          >
            <span>View target companies</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category 3: Pending Assessments */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Pending Assessments</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                {pendingAssessments.length}
              </span>
            </div>

            {pendingAssessments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>No pending assessments!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingAssessments.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/applications?stage=Assessment"
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 block hover:border-purple-400 transition-colors"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.role}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{item.company}</span>
                      <span className="text-purple-600 font-medium">OA / Test</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/applications?stage=Assessment"
            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-800"
          >
            <span>View assessments pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
