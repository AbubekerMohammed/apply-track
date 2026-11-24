"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Filter as FunnelIcon,
  CalendarDays,
  ExternalLink,
} from "lucide-react";

export interface DayMetric {
  date: string;
  label: string;
  count: number;
}

export interface FunnelItem {
  stage: string;
  count: number;
  percentage: number;
}

export interface HeatmapItem {
  date: string;
  count: number;
  level: number;
  weekday: number;
}

interface DashboardChartsProps {
  applicationsPerDay: DayMetric[];
  funnel: FunnelItem[];
  heatmap: HeatmapItem[];
}

export function DashboardCharts({
  applicationsPerDay,
  funnel,
  heatmap,
}: DashboardChartsProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const funnelColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#0284c7", "#10b981"];

  const heatmapLevelColors = [
    "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/50",
    "bg-emerald-200 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800",
    "bg-emerald-400 dark:bg-emerald-800/80 border-emerald-500 dark:border-emerald-700",
    "bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500",
    "bg-emerald-700 dark:bg-emerald-500 border-emerald-800 dark:border-emerald-400",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Applications Per Day (Last 30 Days) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Applications Velocity
                </h3>
                <span className="text-[11px] text-slate-400">
                  Daily submissions over the last 30 days
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/applications")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={applicationsPerDay}
                  onClick={() => router.push("/applications")}
                  className="cursor-pointer"
                >
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as DayMetric;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-lg space-y-0.5">
                            <span className="font-semibold block">{item.label}</span>
                            <span className="text-blue-300 font-bold">
                              {item.count} application{item.count === 1 ? "" : "s"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Click to view in applications list
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3b82f6">
                    {applicationsPerDay.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? "#3b82f6" : "#cbd5e1"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading velocity chart...
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: Applied-to-Offer Funnel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FunnelIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Applied-to-Offer Funnel
                </h3>
                <span className="text-[11px] text-slate-400">
                  Conversion rates across interview stages
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Click any stage to filter
            </span>
          </div>

          <div className="space-y-3 my-auto pt-2">
            {funnel.map((item, idx) => (
              <div
                key={item.stage}
                onClick={() => router.push(`/applications?stage=${encodeURIComponent(item.stage)}`)}
                className="group cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-slate-100 font-bold">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-85"
                    style={{
                      width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%`,
                      backgroundColor: funnelColors[idx % funnelColors.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Overall Conversion: {funnel[funnel.length - 1]?.percentage || 0}%</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {funnel[0]?.count || 0} applied → {funnel[funnel.length - 1]?.count || 0} offer
            </span>
          </div>
        </div>
      </div>

      {/* CHART 3: GitHub-Style Heatmap (Last 12 Weeks) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Application Activity Heatmap
              </h3>
              <span className="text-[11px] text-slate-400">
                Consistency grid for the last 12 weeks (click any cell to view)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-end sm:self-auto">
            <span>Less</span>
            {heatmapLevelColors.map((colorClass, idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-xs border ${colorClass}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5">
            {heatmap.map((cell) => (
              <button
                key={cell.date}
                type="button"
                onClick={() => router.push("/applications")}
                title={`${cell.date}: ${cell.count} applications submitted`}
                className={`w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 focus:outline-hidden ${
                  heatmapLevelColors[cell.level]
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
