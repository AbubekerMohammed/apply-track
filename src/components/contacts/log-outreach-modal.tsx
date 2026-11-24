"use client";

import * as React from "react";
import {
  X,
  Send,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  MessageSquare,
  Building2,
  BellRing,
} from "lucide-react";
import { ContactData } from "./contact-modal";
import { TargetCompanyData } from "../targets/target-modal";

interface LogOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContact?: ContactData | null;
  preselectedTargetCompany?: TargetCompanyData | null;
  onSaved: () => void;
}

export function LogOutreachModal({
  isOpen,
  onClose,
  preselectedContact,
  preselectedTargetCompany,
  onSaved,
}: LogOutreachModalProps) {
  const [contacts, setContacts] = React.useState<ContactData[]>([]);
  const [targets, setTargets] = React.useState<TargetCompanyData[]>([]);
  const [selectedContactId, setSelectedContactId] = React.useState("");
  const [selectedTargetCompanyId, setSelectedTargetCompanyId] = React.useState("");

  const [channel, setChannel] = React.useState("LinkedIn");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = React.useState("");
  const [response, setResponse] = React.useState("Pending");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [enableFollowUp, setEnableFollowUp] = React.useState(true);

  // Duplicate check state
  const [duplicateWarning, setDuplicateWarning] = React.useState<{
    hasContacted: boolean;
    count: number;
    lastOutreach: {
      date: string;
      channel: string;
      message?: string | null;
      response?: string | null;
    } | null;
  } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Calculate default 7-day follow up whenever date changes
  React.useEffect(() => {
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + 7);
      setFollowUpDate(d.toISOString().split("T")[0]);
    }
  }, [date]);

  // Load contacts and targets for dropdowns
  React.useEffect(() => {
    if (isOpen) {
      fetch("/api/contacts")
        .then((r) => r.json())
        .then((data) => {
          if (data.contacts) setContacts(data.contacts);
        })
        .catch(console.error);

      fetch("/api/targets")
        .then((r) => r.json())
        .then((data) => {
          if (data.targets) setTargets(data.targets);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Set preselected items
  React.useEffect(() => {
    if (preselectedContact) {
      setSelectedContactId(preselectedContact.id);
    }
    if (preselectedTargetCompany) {
      setSelectedTargetCompanyId(preselectedTargetCompany.id);
    }
  }, [preselectedContact, preselectedTargetCompany, isOpen]);

  // Check for duplicate outreach whenever selectedContactId changes
  React.useEffect(() => {
    if (!selectedContactId) {
      setDuplicateWarning(null);
      return;
    }

    // Call duplicate check endpoint
    fetch(`/api/outreach/check?contactId=${selectedContactId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.hasContacted) {
          setDuplicateWarning({
            hasContacted: true,
            count: data.count,
            lastOutreach: data.lastOutreach,
          });
        } else {
          setDuplicateWarning(null);
        }
      })
      .catch((err) => {
        console.error("Duplicate check error", err);
      });
  }, [selectedContactId]);

  if (!isOpen) return null;

  const currentContact = contacts.find((c) => c.id === selectedContactId) || preselectedContact;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContactId) {
      setError("Please select a contact to log outreach for");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          targetCompanyId: selectedTargetCompanyId || null,
          channel,
          date: new Date(date).toISOString(),
          message: message || null,
          response,
          followUpDate: enableFollowUp && followUpDate ? new Date(followUpDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log outreach");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Log Outreach
              </h3>
              <p className="text-xs text-slate-400">
                Record messages, pitch responses, and schedule follow-up reminders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* DUPLICATE OUTREACH WARNING BANNER */}
          {duplicateWarning?.hasContacted && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Duplicate Outreach Warning</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                You have already contacted <strong>{currentContact?.name || "this person"}</strong>{" "}
                <strong>{duplicateWarning.count} time(s)</strong>!
                {duplicateWarning.lastOutreach && (
                  <span>
                    {" "}Last contacted on{" "}
                    <strong>
                      {new Date(duplicateWarning.lastOutreach.date).toLocaleDateString()}
                    </strong>{" "}
                    via <strong>{duplicateWarning.lastOutreach.channel}</strong> (Status:{" "}
                    <span className="underline">{duplicateWarning.lastOutreach.response || "Pending"}</span>).
                  </span>
                )}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400/80">
                Double-check your previous message before sending another to prevent annoying contacts.
              </p>
            </div>
          )}

          {/* Contact Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Contact *
            </label>
            <select
              required
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a contact --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company} {c.role ? `(${c.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Target Company Link (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link to Target Company (Optional)
            </label>
            <select
              value={selectedTargetCompanyId}
              onChange={(e) => setSelectedTargetCompanyId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- None / General Outreach --</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.priority} Priority • {t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Outreach Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LinkedIn">LinkedIn DM / Connection</option>
                <option value="Email">Email</option>
                <option value="Twitter">Twitter / X DM</option>
                <option value="Phone">Phone / Coffee Chat</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Outreach Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Message or Pitch Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Sent personalized note highlighting shared interest in distributed systems, mentioned looking at Staff Engineer role."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Response
              </label>
              <select
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending (Awaiting reply)</option>
                <option value="Replied">Replied (Chatting)</option>
                <option value="Referral Secured">Referral Secured 🎉</option>
                <option value="Declined">Declined</option>
                <option value="No Response">No Response</option>
              </select>
            </div>

            {/* Auto-schedule Follow-up Reminder */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BellRing className="w-3 h-3 text-amber-500" />
                  <span>Auto-Schedule Follow-up</span>
                </label>
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => setEnableFollowUp(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              {enableFollowUp ? (
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-xs text-slate-400 py-2">
                  No reminder scheduled
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? "Logging..." : "Log Outreach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
