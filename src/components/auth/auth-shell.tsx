import Link from "next/link";
import { Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Centered card layout shared by the standalone auth pages. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-6 group">
          <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Traill
          </span>
        </Link>
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111622] py-8 px-6 sm:px-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthNotice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400"
      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${styles}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export const authLinkClass =
  "block text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline";

export const authInputClass =
  "w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export const authButtonClass =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-sm transition-colors disabled:opacity-50 shadow-xs";
