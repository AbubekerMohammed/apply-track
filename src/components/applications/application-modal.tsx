"use client";

import * as React from "react";
import { X, Loader2, Plus, Edit } from "lucide-react";

export interface ContactOption {
  id: string;
  name: string;
  company: string;
}

export interface ApplicationFormData {
  id?: string;
  company: string;
  role: string;
  location?: string | null;
  jobLink?: string | null;
  dateApplied?: string;
  source?: string;
  referred?: boolean;
  referrerContactId?: string | null;
  stage?: string;
  salaryRange?: string | null;
  notes?: string | null;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: ApplicationFormData) => Promise<void>;
  initialData?: ApplicationFormData | null;
  contacts?: ContactOption[];
}

export const STAGES = [
  "Applied",
  "Assessment",
  "Recruiter Call",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted",
];

export const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Company Website",
  "Referral",
  "Wellfound / AngelList",
  "Glassdoor",
  "Recruiter Outreach",
  "Other",
];

export function ApplicationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  contacts = [],
}: ApplicationModalProps) {
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [jobLink, setJobLink] = React.useState("");
  const [dateApplied, setDateApplied] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [source, setSource] = React.useState("LinkedIn");
  const [stage, setStage] = React.useState("Applied");
  const [referred, setReferred] = React.useState(false);
  const [referrerContactId, setReferrerContactId] = React.useState("");
  const [salaryRange, setSalaryRange] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || "");
      setRole(initialData.role || "");
      setLocation(initialData.location || "");
      setJobLink(initialData.jobLink || "");
      setDateApplied(
        initialData.dateApplied
          ? new Date(initialData.dateApplied).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setSource(initialData.source || "LinkedIn");
      setStage(initialData.stage || "Applied");
      setReferred(Boolean(initialData.referred));
      setReferrerContactId(initialData.referrerContactId || "");
      setSalaryRange(initialData.salaryRange || "");
      setNotes(initialData.notes || "");
    } else {
      setCompany("");
      setRole("");
      setLocation("");
      setJobLink("");
      setDateApplied(new Date().toISOString().split("T")[0]);
      setSource("LinkedIn");
      setStage("Applied");
      setReferred(false);
      setReferrerContactId("");
      setSalaryRange("");
      setNotes("");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Company and Role are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        id: initialData?.id,
        company,
        role,
        location,
        jobLink,
        dateApplied,
        source,
        stage,
        referred,
        referrerContactId: referred ? referrerContactId || null : null,
        salaryRange,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {initialData?.id ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialData?.id ? "Edit Job Application" : "Add Job Application"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Google"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Title *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Applied
              </label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, San Francisco, CA"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Posting Link
              </label>
              <input
                type="url"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salary Range
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $170,000 - $210,000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Referral Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={referred}
                onChange={(e) => setReferred(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Referred by an internal contact</span>
            </label>

            {referred && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Select Contact
                </label>
                <select
                  value={referrerContactId}
                  onChange={(e) => setReferrerContactId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose from your contacts --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add interview notes, recruiter details, tech stack specifics..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData?.id ? "Save Changes" : "Create Application"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
