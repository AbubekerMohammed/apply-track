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
      title: "Total Applied",
      value: stats.applied,
      subtitle: `${stats.heardBack} responses received`,
      href: "/applications",
      icon: Briefcase,
      color: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      subtitle: "Industry average: ~10-15%",
      href: "/applications",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      subtitle: `${stats.recruiterCalls} recruiter calls scheduled`,
      href: "/applications?stage=Interviewing",
      icon: Video,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Offers",
      value: stats.offers,
      subtitle: stats.offers > 0 ? "Congratulations!" : "In active pipeline",
      href: "/applications?stage=Offer",
      icon: Award,
      color: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
  ];

  const stagesList = [
    { name: "Applied", count: stats.applied, stage: "Applied", color: "bg-blue-500" },
    { name: "Assessment", count: stats.assessments, stage: "Assessment", color: "bg-purple-500" },
    { name: "Recruiter Call", count: stats.recruiterCalls, stage: "Recruiter Call", color: "bg-indigo-500" },
    { name: "Interviewing", count: stats.interviews, stage: "Interviewing", color: "bg-amber-500" },
    { name: "Offer", count: stats.offers, stage: "Offer", color: "bg-emerald-500" },
    { name: "Rejected", count: stats.rejections, stage: "Rejected", color: "bg-rose-500" },
    { name: "Ghosted", count: stats.ghosted, stage: "Ghosted", color: "bg-slate-400" },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="p-5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>{card.subtitle}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stage Breakdown Filter Pills */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2">
          Pipeline Stages:
        </span>
        {stagesList.map((item) => (
          <Link
            key={item.name}
            href={`/applications?stage=${encodeURIComponent(item.stage)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            <span>{item.name}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
