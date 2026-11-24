"use client";

import * as React from "react";
import {
  Building2,
  Plus,
  ExternalLink,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Circle,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  Flame,
} from "lucide-react";
import { TargetModal, TargetCompanyData } from "./target-modal";
import { LogOutreachModal } from "../contacts/log-outreach-modal";

interface TargetsViewProps {
  initialTargets: TargetCompanyData[];
  userEmail?: string | null;
}

const DEFAULT_STEPS = [
  { id: "find_contact", label: "Find a contact" },
  { id: "send_outreach", label: "Send outreach" },
  { id: "follow_up", label: "Follow up" },
  { id: "get_referral", label: "Get the referral" },
  { id: "apply", label: "Apply" },
];

export function TargetsView({ initialTargets, userEmail }: TargetsViewProps) {
  const [targets, setTargets] = React.useState<TargetCompanyData[]>(initialTargets);
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingTarget, setEditingTarget] = React.useState<TargetCompanyData | null>(null);

  // Outreach modal state
  const [outreachModalOpen, setOutreachModalOpen] = React.useState(false);
  const [targetForOutreach, setTargetForOutreach] = React.useState<TargetCompanyData | null>(null);

  async function refreshTargets() {
    try {
      const res = await fetch("/api/targets");
      if (res.ok) {
        const data = await res.json();
        setTargets(data.targets);
      }
    } catch (err) {
      console.error("Failed to refresh targets", err);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/targets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete target", err);
    }
  }

  async function handleToggleChecklistItem(targetId: string, itemId: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        const currentList = t.checklist || DEFAULT_STEPS.map((s) => ({ ...s, completed: false }));
        const updatedList = currentList.map((item) =>
          item.id === itemId ? { ...item, completed: newCompleted } : item
        );
        return { ...t, checklist: updatedList };
      })
    );

    try {
      const res = await fetch(`/api/targets/${targetId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, completed: newCompleted }),
      });

      if (res.ok) {
        const data = await res.json();
        setTargets((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, ...data.target } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update checklist item", err);
      refreshTargets();
    }
  }

  const filteredTargets = targets.filter((target) => {
    const matchesSearch =
      target.name.toLowerCase().includes(search.toLowerCase()) ||
      (target.targetRole && target.targetRole.toLowerCase().includes(search.toLowerCase()));

    const matchesPriority = priorityFilter === "all" || target.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || target.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate metrics
  const totalCount = targets.length;
  const needsReferralCount = targets.filter((t) => t.status === "Needs referral").length;
  const outreachSentCount = targets.filter((t) => t.status === "Outreach sent").length;
  const referralSecuredCount = targets.filter((t) => t.status === "Referral secured").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200">Targets & Referrals</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Targets & Referrals
            </h1>
            {needsReferralCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 tabular-nums">
                <AlertCircle className="w-3 h-3" />
                <span>{needsReferralCount} Need Referrals</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {userEmail ? `${userEmail} • ` : ""}
            Track target companies and coordinate referral outreach before applying
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTarget(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target Company</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Targets</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
        </div>

        {/* Needs Referral Highlighting */}
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Needs Referral</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
            {needsReferralCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Outreach Sent</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {outreachSentCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Referrals Secured</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {referralSecuredCount}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Needs referral">Needs referral</option>
            <option value="Outreach sent">Outreach sent</option>
            <option value="Referral secured">Referral secured</option>
            <option value="Applied">Applied</option>
          </select>
        </div>
      </div>

      {/* Target Companies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTargets.length === 0 ? (
          <div className="col-span-full py-12 text-center p-8 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No target companies found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add the top companies you want to join and systematically track contacts and referrals.
            </p>
            <button
              onClick={() => {
                setEditingTarget(null);
                setModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-medium shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Target</span>
            </button>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const isNeedsReferral = target.status === "Needs referral";
            const checklist =
              target.checklist && Array.isArray(target.checklist) && target.checklist.length === 5
                ? target.checklist
                : DEFAULT_STEPS.map((s) => ({ ...s, completed: false }));

            const completedCount = checklist.filter((i) => i.completed).length;
            const progressPercent = Math.round((completedCount / 5) * 100);

            return (
              <div
                key={target.id}
                className={`group relative p-5 rounded-xl transition-all duration-200 flex flex-col justify-between ${
                  isNeedsReferral
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-400/90 dark:border-amber-500/80 shadow-xs"
                    : "bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {target.name}
                        </h3>
                        {isNeedsReferral && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          >
                            Needs Referral
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {target.targetRole || "Any Open Position"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          target.priority === "High"
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                            : target.priority === "Medium"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {target.priority}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Strategy snippet */}
                  {target.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                      {target.notes}
                    </p>
                  )}

                  {/* Checklist Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Referral Checklist
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {completedCount}/5 ({progressPercent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progressPercent === 100
                            ? "bg-emerald-500"
                            : isNeedsReferral
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-1.5 pt-1">
                      {checklist.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleChecklistItem(target.id, item.id, item.completed)}
                          className="w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors group/item"
                        >
                          <span
                            className={`text-xs flex items-center gap-2 ${
                              item.completed
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : "text-slate-700 dark:text-slate-300 font-medium"
                            }`}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 group-hover/item:text-blue-500" />
                            )}
                            <span>{item.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        target.status === "Referral secured"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : target.status === "Applied"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : target.status === "Outreach sent"
                          ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {target.status}
                    </span>

                    {target.jobLink && (
                      <a
                        href={target.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Open job / careers link in new tab"
                      >
                        <span>Careers</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTargetForOutreach(target);
                        setOutreachModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Log outreach for this company"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTarget(target);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit target"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(target.id, target.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Target Modal */}
      <TargetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTarget(null);
        }}
        target={editingTarget}
        onSaved={refreshTargets}
      />

      {/* Log Outreach Modal directly from Target */}
      <LogOutreachModal
        isOpen={outreachModalOpen}
        onClose={() => {
          setOutreachModalOpen(false);
          setTargetForOutreach(null);
        }}
        preselectedTargetCompany={targetForOutreach}
        onSaved={refreshTargets}
      />
    </div>
  );
}
