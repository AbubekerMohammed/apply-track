"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Target, Settings } from "lucide-react";

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
    <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Daily Goal
            </h3>
            <span className="text-xs text-slate-400">
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
      <div className="flex items-center justify-center my-4 relative">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
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
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {appliedToday}
            <span className="text-xs font-semibold text-slate-400">/{dailyGoal}</span>
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {percentage}% Done
          </span>
        </div>
      </div>

      {/* Streak Counter and Status */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {streak} Day Streak
          </span>
        </div>

        <span className="text-xs text-slate-400">
          {isGoalReached ? "Goal achieved!" : `${dailyGoal - appliedToday} more needed today`}
        </span>
      </div>
    </div>
  );
}
