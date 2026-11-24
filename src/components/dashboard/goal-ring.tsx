"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Target, Settings, Sparkles, CheckCircle2 } from "lucide-react";

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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const isGoalReached = appliedToday >= dailyGoal;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Daily Goal
            </h3>
            <span className="text-[11px] text-slate-400">
              Target: {dailyGoal} applications / day
            </span>
          </div>
        </div>
        <Link
          href="/settings"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Change daily goal in Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      {/* Circular Progress Ring */}
      <div className="flex items-center justify-center my-3 relative">
        <svg className="w-36 h-36 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`transition-all duration-700 ease-out ${
              isGoalReached
                ? "text-emerald-500"
                : percentage >= 50
                ? "text-blue-600"
                : "text-amber-500"
            }`}
          />
        </svg>

        {/* Center Text inside ring */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {appliedToday}
            <span className="text-xs font-semibold text-slate-400">/{dailyGoal}</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {percentage}% Done
          </span>
        </div>
      </div>

      {/* Streak Counter and Status */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {streak} Day{streak === 1 ? "" : "s"}
            </span>
            <span className="text-[10px] text-slate-400">Active Streak</span>
          </div>
        </div>

        <div>
          {isGoalReached ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Goal Met!
            </span>
          ) : (
            <Link
              href="/applications"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>+ Apply now</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
