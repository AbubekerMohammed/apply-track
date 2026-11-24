"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  MessageSquare,
  ClipboardCheck,
  PhoneCall,
  Video,
  Award,
  XCircle,
  Percent,
  ArrowRight,
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
  const cards = [
    {
      title: "Applied",
      value: stats.applied,
      subtitle: "Total submitted",
      href: "/applications",
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60",
    },
    {
      title: "Heard Back",
      value: stats.heardBack,
      subtitle: "Responses received",
      href: "/applications?stage=Assessment",
      icon: MessageSquare,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/60",
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      subtitle: `${stats.heardBack} of ${stats.applied} replied`,
      href: "/applications",
      icon: Percent,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/60",
    },
    {
      title: "Assessments",
      value: stats.assessments,
      subtitle: "Take-homes & OA",
      href: "/applications?stage=Assessment",
      icon: ClipboardCheck,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/60",
    },
    {
      title: "Recruiter Calls",
      value: stats.recruiterCalls,
      subtitle: "Initial screens",
      href: "/applications?stage=Recruiter Call",
      icon: PhoneCall,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      subtitle: "Technical & rounds",
      href: "/applications?stage=Interviewing",
      icon: Video,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/60",
    },
    {
      title: "Offers",
      value: stats.offers,
      subtitle: "Offers received",
      href: "/applications?stage=Offer",
      icon: Award,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/60",
    },
    {
      title: "Rejections",
      value: stats.rejections,
      subtitle: "Archived rejections",
      href: "/applications?stage=Rejected",
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/60",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            href={card.href}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {card.value}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400 truncate">
                  {card.subtitle}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
