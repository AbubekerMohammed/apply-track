"use client";

import * as React from "react";
import { Mail, Send, Ghost, Eye, CheckCircle2, Clock } from "lucide-react";

export function WeeklyDigestSettings() {
  const [loadingEmail, setLoadingEmail] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null);

  const [loadingGhost, setLoadingGhost] = React.useState(false);
  const [ghostStatus, setGhostStatus] = React.useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = React.useState(false);

  async function handleSendWeeklyEmail() {
    setLoadingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/email/weekly-summary", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus(data.message || "Weekly summary email successfully sent!");
      } else {
        setEmailStatus(`Error: ${data.error || "Failed to send weekly email"}`);
      }
    } catch {
      setEmailStatus("Failed to send weekly summary email");
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleAutoGhostScan() {
    setLoadingGhost(true);
    setGhostStatus(null);
    try {
      const res = await fetch("/api/applications/auto-ghost", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGhostStatus(data.message);
      } else {
        setGhostStatus(`Error: ${data.error}`);
      }
    } catch {
      setGhostStatus("Failed to run auto-ghost scan");
    } finally {
      setLoadingGhost(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary Email Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Weekly Summary Email
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive an executive digest of weekly application volume, interview progression, and upcoming follow-ups
              </p>
            </div>
          </div>
        </div>

        {emailStatus && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{emailStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleSendWeeklyEmail}
            disabled={loadingEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loadingEmail ? "Generating & Sending..." : "Send Weekly Summary Now"}</span>
          </button>

          <a
            href="/api/email/weekly-summary"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview HTML Template</span>
          </a>
        </div>
      </div>

      {/* 30-Day Auto-Ghosting Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Ghost className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Ghosted Auto-Marking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatically advances applications with no reply after 30 days to &quot;Ghosted&quot; to keep your active pipeline clean
            </p>
          </div>
        </div>

        {ghostStatus && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{ghostStatus}</span>
          </div>
        )}

        <div className="pt-1">
          <button
            onClick={handleAutoGhostScan}
            disabled={loadingGhost}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>{loadingGhost ? "Scanning Pipeline..." : "Scan & Auto-Mark Inactive Applications"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
