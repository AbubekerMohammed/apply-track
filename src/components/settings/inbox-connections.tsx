"use client";

import * as React from "react";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface InboxConnectionsProps {
  initialGmailConnected: boolean;
  initialOutlookConnected: boolean;
  onSyncComplete?: () => void;
}

export function InboxConnections({
  initialGmailConnected,
  initialOutlookConnected,
  onSyncComplete,
}: InboxConnectionsProps) {
  const [gmailConnected, setGmailConnected] = React.useState(initialGmailConnected);
  const [outlookConnected, setOutlookConnected] = React.useState(initialOutlookConnected);
  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{
    newApplicationsCreated: number;
    stagesUpdated: number;
    needsReviewCount: number;
    duplicatesSkipped: number;
  } | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleToggleConnection(provider: "gmail" | "outlook", connect: boolean) {
    try {
      const endpoint = connect ? "/api/email/connect" : "/api/email/disconnect";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (res.ok) {
        if (provider === "gmail") setGmailConnected(connect);
        if (provider === "outlook") setOutlookConnected(connect);
        setMessage(
          `${provider === "gmail" ? "Gmail" : "Outlook"} ${
            connect ? "connected successfully" : "disconnected"
          }`
        );
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage("Failed to update connection status.");
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncResult(null);
    setMessage(null);

    try {
      const res = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to sync emails");
      } else {
        setSyncResult(data.result);
        if (onSyncComplete) onSyncComplete();
      }
    } catch {
      setMessage("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {syncResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Email Sync Complete</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block">New Apps</span>
              <span className="font-bold">{syncResult.newApplicationsCreated}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Stages Updated</span>
              <span className="font-bold">{syncResult.stagesUpdated}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Needs Review</span>
              <span className="font-bold text-amber-600">{syncResult.needsReviewCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Duplicates Filtered</span>
              <span className="font-bold">{syncResult.duplicatesSkipped}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inboxes Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gmail Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold text-sm border border-red-200 dark:border-red-900/50">
                G
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Gmail Integration
                </h4>
                <span className="text-xs text-slate-400">Google Workspace & Gmail</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                gmailConnected
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {gmailConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Syncs job application confirmations, OA assessments (HackerRank, CodeSignal),
            interview invites, and offers. Read-only scope: no full bodies stored.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {gmailConnected ? (
              <button
                type="button"
                onClick={() => handleToggleConnection("gmail", false)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Disconnect Gmail
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleConnection("gmail", true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Connect Gmail
              </button>
            )}
          </div>
        </div>

        {/* Outlook Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-900/50">
                O
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Outlook Integration
                </h4>
                <span className="text-xs text-slate-400">Microsoft 365 & Outlook</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                outlookConnected
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {outlookConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Uses Microsoft Graph API with unified classification pipeline. Cross-provider
            de-duplication prevents duplicate applications across both inboxes.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {outlookConnected ? (
              <button
                type="button"
                onClick={() => handleToggleConnection("outlook", false)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Disconnect Outlook
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleConnection("outlook", true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Connect Outlook
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Sync Now Bar */}
      {(gmailConnected || outlookConnected) && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Auto-Sync: Last 90 Days active (every 15 mins)
            </span>
            <span className="text-[11px] text-slate-400">
              Run manual sync now to pull new email confirmations and interview status updates.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 shrink-0"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{syncing ? "Syncing Inboxes..." : "Sync Now"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
