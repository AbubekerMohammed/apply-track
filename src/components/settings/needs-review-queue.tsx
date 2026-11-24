"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Link as LinkIcon,
  Mail,
  Loader2,
  ExternalLink,
} from "lucide-react";

export interface ReviewItem {
  id: string;
  provider: string;
  sender: string;
  subject: string;
  snippet: string;
  classification: string;
  confidence: number | null;
  date: string | Date;
  extractedData: any;
}

interface NeedsReviewQueueProps {
  initialItems: ReviewItem[];
  userApplications: { id: string; company: string; role: string }[];
}

export function NeedsReviewQueue({
  initialItems,
  userApplications,
}: NeedsReviewQueueProps) {
  const [items, setItems] = React.useState<ReviewItem[]>(initialItems);
  const [selectedAppMap, setSelectedAppMap] = React.useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  async function handleAction(eventId: string, action: "approve" | "dismiss", useExisting = false) {
    setResolvingId(eventId);
    const item = items.find((i) => i.id === eventId);
    const selectedAppId = selectedAppMap[eventId];

    try {
      const res = await fetch("/api/email/needs-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action,
          applicationId: useExisting ? selectedAppId : undefined,
          company: item?.extractedData?.company || "Unknown Company",
          role: item?.extractedData?.role || "Software Engineer",
          stage: "Applied",
        }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== eventId));
      }
    } catch {
      console.error("Failed to resolve review item");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Needs Review Queue ({items.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Low-confidence or ambiguous email classifications awaiting confirmation
            </span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Queue is clear!
          </span>
          <span className="text-[11px]">
            No low-confidence email matches require your attention right now.
          </span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const confidencePercent = Math.round((item.confidence || 0.6) * 100);
            const isResolving = resolvingId === item.id;

            return (
              <div key={item.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.provider}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.subject}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      From: {item.sender} • {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-900 shrink-0 self-start">
                    {confidencePercent}% Confidence Match
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 font-sans">
                  &ldquo;{item.snippet}&rdquo;
                </p>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAppMap[item.id] || ""}
                      onChange={(e) =>
                        setSelectedAppMap((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">-- Match with existing app --</option>
                      {userApplications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.company} ({app.role})
                        </option>
                      ))}
                    </select>

                    {selectedAppMap[item.id] && (
                      <button
                        type="button"
                        disabled={isResolving}
                        onClick={() => handleAction(item.id, "approve", true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link to App</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={() => handleAction(item.id, "approve", false)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Application</span>
                    </button>

                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={() => handleAction(item.id, "dismiss")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
