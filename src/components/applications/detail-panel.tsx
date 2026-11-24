"use client";

import * as React from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  Trash2,
  Edit,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { STAGES } from "./application-modal";

export interface StageHistoryItem {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedAt: string | Date;
  notes?: string | null;
}

export interface EmailEventItem {
  id: string;
  provider: string;
  sender: string;
  subject: string;
  snippet: string;
  classification: string;
  date: string | Date;
}

export interface ApplicationDetail {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  jobLink?: string | null;
  dateApplied: string | Date;
  source?: string | null;
  referred: boolean;
  referrerContactId?: string | null;
  referrerContact?: {
    id: string;
    name: string;
    company: string;
    email?: string | null;
  } | null;
  stage: string;
  salaryRange?: string | null;
  notes?: string | null;
  stageHistory?: StageHistoryItem[];
  emailEvents?: EmailEventItem[];
}

interface DetailPanelProps {
  application: ApplicationDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (app: ApplicationDetail) => void;
  onDelete: (id: string) => Promise<void>;
  onStageChange: (id: string, newStage: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
}

export function DetailPanel({
  application,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStageChange,
  onUpdateNotes,
}: DetailPanelProps) {
  const [notes, setNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [stageUpdating, setStageUpdating] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (application) {
      setNotes(application.notes || "");
      setDeleteConfirm(false);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  async function handleNotesSave() {
    if (!application) return;
    setSavingNotes(true);
    try {
      await onUpdateNotes(application.id, notes);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleStageSelect(newStage: string) {
    if (!application || newStage === application.stage) return;
    setStageUpdating(true);
    try {
      await onStageChange(application.id, newStage);
    } finally {
      setStageUpdating(false);
    }
  }

  const stageColors: Record<string, string> = {
    Applied: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    Assessment: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
    "Recruiter Call": "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    Interviewing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900",
    Offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    Rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    Ghosted: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {application.role}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{application.company}</span>
              {application.location && (
                <>
                  <span>•</span>
                  <span>{application.location}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stage Switcher */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Application Stage
            </span>
            <div className="flex items-center gap-3">
              <select
                disabled={stageUpdating}
                value={application.stage}
                onChange={(e) => handleStageSelect(e.target.value)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  stageColors[application.stage] || stageColors.Applied
                }`}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400">
                {stageUpdating ? "Updating..." : "Select to advance stage"}
              </span>
            </div>
          </div>

          {/* Key Application Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" /> Date Applied
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {new Date(application.dateApplied).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5" /> Salary Range
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {application.salaryRange || "Not specified"}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
              <span className="text-slate-400 block font-medium">Source</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {application.source || "Direct"}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5" /> Referral Status
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {application.referred ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Yes {application.referrerContact ? `(${application.referrerContact.name})` : ""}
                  </span>
                ) : (
                  "Direct / No referral"
                )}
              </span>
            </div>
          </div>

          {/* Job Posting Link (Opens in new tab) */}
          {application.jobLink && (
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 block truncate">
                  {application.jobLink}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400">
                  Original job posting
                </span>
              </div>
              <a
                href={application.jobLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
              >
                <span>View Job</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Notes Section with Save */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes & Interview Highlights
              </label>
              <button
                type="button"
                onClick={handleNotesSave}
                disabled={savingNotes}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keep track of questions asked, salary talks, next steps..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          {/* Stage-change Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Stage-Change Timeline
              </h3>
            </div>

            {application.stageHistory && application.stageHistory.length > 0 ? (
              <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {application.stageHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.fromStage ? `${item.fromStage} → ` : ""}
                        <span className="text-blue-600 dark:text-blue-400">
                          {item.toStage}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.changedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No stage changes recorded yet.
              </p>
            )}
          </div>

          {/* Linked Emails Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Linked Emails ({application.emailEvents?.length || 0})
              </h3>
            </div>

            {application.emailEvents && application.emailEvents.length > 0 ? (
              <div className="space-y-2">
                {application.emailEvents.map((em) => (
                  <div
                    key={em.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {em.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 shrink-0">
                        {em.classification.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>From: {em.sender}</span>
                      <span>{new Date(em.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {em.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <span>No emails linked yet.</span>
                <span className="block text-[11px] text-slate-400">
                  Connect Gmail or Outlook in Settings to automatically sync matching emails.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Are you sure?</span>
              <button
                type="button"
                onClick={() => onDelete(application.id)}
                className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(application)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
