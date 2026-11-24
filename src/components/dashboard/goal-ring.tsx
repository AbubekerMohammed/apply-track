"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Settings, ArrowUpRight } from "lucide-react";

interface GoalRingProps {
  dailyGoal: number;
  appliedToday: number;
  percentage: number;
  streak: number;
}

export function GoalRing({
  dailyGoal,
  appliedToday,
  percentage,
  streak,
}: GoalRingProps) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const isGoalReached = appliedToday >= dailyGoal;

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-[#11141A] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
            Target Pace
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Goal
          </span>
        </div>
        <Link
          href="/settings"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          title="Configure goal in Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SVG Telemetry Gauge */}
      <div className="flex items-center justify-center my-4 relative">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Subtle track ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-100 dark:text-white/[0.07]"
          />
          {/* Active progress ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`transition-all duration-700 ease-out ${
              isGoalReached
                ? "text-emerald-500 dark:text-emerald-400"
                : percentage >= 50
                ? "text-slate-900 dark:text-white"
                : "text-amber-500"
            }`}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {appliedToday}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/{dailyGoal}</span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {percentage}% Completed
          </span>
        </div>
      </div>

      {/* Streak Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-3 h-3 fill-amber-500" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {streak} Day Streak
          </span>
        </div>

        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {isGoalReached ? "Goal achieved" : `${dailyGoal - appliedToday} remaining`}
        </span>
      </div>
    </div>
  );
}
