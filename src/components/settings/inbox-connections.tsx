"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface MailboxState {
  connected: boolean;
  address: string | null;
  configured: boolean;
}

interface InboxConnectionsProps {
  gmail: MailboxState;
  outlook: MailboxState;
  notice?: { kind: "success" | "error"; text: string } | null;
}

interface SyncSummary {
  newApplicationsCreated: number;
  stagesUpdated: number;
  needsReviewCount: number;
  duplicatesSkipped: number;
  totalProcessed: number;
}

const PROVIDERS = {
  gmail: {
    label: "Gmail",
    title: "Gmail Integration",
    subtitle: "Google Workspace & Gmail",
    badge: "G",
    badgeClass:
      "bg-red-50 dark:bg-red-950/50 text-red-600 border-red-200 dark:border-red-900/50",
    description:
      "Reads job application confirmations, assessments, interview invites, and offers. Read-only access; only subject, sender and a short snippet are stored.",
  },
  outlook: {
    label: "Outlook",
    title: "Outlook Integration",
    subtitle: "Microsoft 365 & Outlook",
    badge: "O",
    badgeClass:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-600 border-blue-200 dark:border-blue-900/50",
    description:
      "Uses Microsoft Graph with read-only mail access. Duplicate emails across both inboxes are filtered automatically.",
  },
} as const;

export function InboxConnections({ gmail, outlook, notice }: InboxConnectionsProps) {
  const router = useRouter();
  const [state, setState] = React.useState({ gmail, outlook });
  const [syncing, setSyncing] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [syncResult, setSyncResult] = React.useState<SyncSummary | null>(null);
  const [message, setMessage] = React.useState(notice ?? null);

  async function handleDisconnect(provider: "gmail" | "outlook") {
    setBusy(provider);
    setMessage(null);
    try {
      const res = await fetch("/api/email/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error();
      setState((s) => ({ ...s, [provider]: { ...s[provider], connected: false, address: null } }));
      setMessage({ kind: "success", text: `${PROVIDERS[provider].label} disconnected.` });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Could not disconnect. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncResult(null);
    setMessage(null);

    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Failed to sync emails." });
      } else {
        setSyncResult(data.result);
        if (data.errors?.length) {
          setMessage({
            kind: "error",
            text: data.errors.map((e: { message: string }) => e.message).join(" "),
          });
        }
        router.refresh();
      }
    } catch {
      setMessage({ kind: "error", text: "Sync request failed. Check your connection." });
    } finally {
      setSyncing(false);
    }
  }

  const anyConnected = state.gmail.connected || state.outlook.connected;

  return (
    <div className="space-y-5">
      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.kind === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
              : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
          }`}
        >
          {message.kind === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {syncResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Email sync complete: {syncResult.totalProcessed} job-related email
              {syncResult.totalProcessed === 1 ? "" : "s"} found
            </span>
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
              <span className="text-[10px] text-slate-400 block">Already Imported</span>
              <span className="font-bold">{syncResult.duplicatesSkipped}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["gmail", "outlook"] as const).map((provider) => {
          const meta = PROVIDERS[provider];
          const box = state[provider];
          return (
            <div
              key={provider}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border ${meta.badgeClass}`}
                  >
                    {meta.badge}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {meta.title}
                    </h4>
                    <span className="text-xs text-slate-400 block truncate">
                      {box.connected && box.address ? box.address : meta.subtitle}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    box.connected
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {box.connected ? "Connected" : "Not connected"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {meta.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {box.connected ? (
                  <button
                    type="button"
                    disabled={busy === provider}
                    onClick={() => handleDisconnect(provider)}
                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                  >
                    {busy === provider ? "Disconnecting..." : `Disconnect ${meta.label}`}
                  </button>
                ) : box.configured ? (
                  <a
                    href={`/api/email/connect/${provider}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Connect {meta.label}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {meta.label} connection isn&apos;t available yet.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {anyConnected && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Inbox sync: last 90 days, refreshed daily
            </span>
            <span className="text-[11px] text-slate-400">
              Run a manual sync to pull new confirmations and interview updates now.
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
