"use client";

import * as React from "react";
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  Check,
  X,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ApplicationModal, ApplicationFormData, STAGES, SOURCES } from "./application-modal";
import { DetailPanel, ApplicationDetail } from "./detail-panel";
import { KanbanView } from "./kanban-view";

interface ApplicationsViewProps {
  initialApplications: ApplicationDetail[];
  contacts?: { id: string; name: string; company: string }[];
}

type SortField = "company" | "role" | "dateApplied" | "stage" | "salaryRange";
type SortOrder = "asc" | "desc";

export function ApplicationsView({
  initialApplications,
  contacts = [],
}: ApplicationsViewProps) {
  const [applications, setApplications] = React.useState<ApplicationDetail[]>(initialApplications);
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">("table");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStage, setSelectedStage] = React.useState("all");
  const [selectedReferred, setSelectedReferred] = React.useState("all");
  const [selectedSource, setSelectedSource] = React.useState("all");
  const [dateRangeFilter, setDateRangeFilter] = React.useState("all");

  // Sort State
  const [sortField, setSortField] = React.useState<SortField>("dateApplied");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  // Modal & Drawer States
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingApplication, setEditingApplication] = React.useState<ApplicationFormData | null>(null);
  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState<string | null>(null);

  // Synchronize when initialApplications updates
  React.useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  // Keep selectedApplication synced with applications state
  React.useEffect(() => {
    if (selectedApplication) {
      const fresh = applications.find((a) => a.id === selectedApplication.id);
      if (fresh) setSelectedApplication(fresh);
    }
  }, [applications]);

  // Filtering Logic
  const filteredApplications = React.useMemo(() => {
    const now = new Date().getTime();

    return applications.filter((app) => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCompany = app.company.toLowerCase().includes(q);
        const matchesRole = app.role.toLowerCase().includes(q);
        const matchesLocation = app.location?.toLowerCase().includes(q);
        const matchesNotes = app.notes?.toLowerCase().includes(q);
        if (!matchesCompany && !matchesRole && !matchesLocation && !matchesNotes) {
          return false;
        }
      }

      // Stage filter
      if (selectedStage !== "all" && app.stage !== selectedStage) {
        return false;
      }

      // Referral filter
      if (selectedReferred === "referred" && !app.referred) return false;
      if (selectedReferred === "not_referred" && app.referred) return false;

      // Source filter
      if (selectedSource !== "all" && app.source !== selectedSource) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== "all") {
        const appDate = new Date(app.dateApplied).getTime();
        const daysDiff = (now - appDate) / (1000 * 3600 * 24);
        if (dateRangeFilter === "7d" && daysDiff > 7) return false;
        if (dateRangeFilter === "30d" && daysDiff > 30) return false;
        if (dateRangeFilter === "90d" && daysDiff > 90) return false;
      }

      return true;
    });
  }, [
    applications,
    searchQuery,
    selectedStage,
    selectedReferred,
    selectedSource,
    dateRangeFilter,
  ]);

  // Sorting Logic
  const sortedApplications = React.useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (sortField === "dateApplied") {
        const aTime = new Date(a.dateApplied).getTime();
        const bTime = new Date(b.dateApplied).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aStr = (a[sortField] || "").toString().toLowerCase();
      const bStr = (b[sortField] || "").toString().toLowerCase();

      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredApplications, sortField, sortOrder]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  // API Callbacks
  async function handleSaveApplication(formData: ApplicationFormData) {
    if (formData.id) {
      // Update existing
      const res = await fetch(`/api/applications/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update application");
      const { application } = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? application : a))
      );
    } else {
      // Create new
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create application");
      const { application } = await res.json();
      setApplications((prev) => [application, ...prev]);
    }
  }

  async function handleStageChange(id: string, newStage: string) {
    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a))
    );

    const res = await fetch(`/api/applications/${id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });

    if (res.ok) {
      const { application } = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? application : a))
      );
    }
  }

  async function handleUpdateNotes(id: string, newNotes: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: newNotes }),
    });
    if (res.ok) {
      const { application } = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? application : a))
      );
    }
  }

  async function handleDeleteApplication(id: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setIsDetailOpen(false);
      setSelectedApplication(null);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/applications/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        setImportMessage(data.error || "Failed to import CSV");
      } else {
        setImportMessage(`Successfully imported ${data.importedCount} applications!`);
        // Refresh applications list
        const refreshRes = await fetch("/api/applications");
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setApplications(freshData.applications);
        }
        setTimeout(() => setIsImportModalOpen(false), 1200);
      }
    } catch {
      setImportMessage("Failed to upload file");
    } finally {
      setImporting(false);
    }
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedStage !== "all" ||
    selectedReferred !== "all" ||
    selectedSource !== "all" ||
    dateRangeFilter !== "all";

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedStage("all");
    setSelectedReferred("all");
    setSelectedSource("all");
    setDateRangeFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <span>Applications Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {sortedApplications.length} of {applications.length} applications
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Import / Export Buttons */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <a
            href="/api/applications/export"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          {/* Add New Application Button */}
          <button
            onClick={() => {
              setEditingApplication(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role, location, notes..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Referred Filter */}
          <div>
            <select
              value={selectedReferred}
              onChange={(e) => setSelectedReferred(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Applications</option>
              <option value="referred">Referred Only</option>
              <option value="not_referred">Non-Referred</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Any Date</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row & active filters reset */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Sources</option>
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area: Table or Kanban */}
      {viewMode === "table" ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {sortedApplications.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No job applications match your filters.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing your search terms or add a new application to your pipeline.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th
                      onClick={() => handleSort("company")}
                      className="pb-3 pr-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Company</span>
                        {sortField === "company" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("role")}
                      className="pb-3 pr-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role</span>
                        {sortField === "role" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("stage")}
                      className="pb-3 pr-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Stage</span>
                        {sortField === "stage" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("dateApplied")}
                      className="pb-3 pr-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date Applied</span>
                        {sortField === "dateApplied" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="pb-3 pr-4">Referred</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 text-right">Posting Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsDetailOpen(true);
                      }}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {app.company}
                        </div>
                        {app.location && (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {app.location}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {app.role}
                        </span>
                        {app.salaryRange && (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {app.salaryRange}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                          {app.stage}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(app.dateApplied).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 pr-4">
                        {app.referred ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-slate-500 dark:text-slate-400">
                        {app.source || "Direct"}
                      </td>
                      <td className="py-3.5 text-right">
                        {app.jobLink ? (
                          <a
                            href={app.jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline p-1"
                            title="Open link in new tab"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Kanban View */
        <KanbanView
          applications={sortedApplications}
          onSelectApplication={(app) => {
            setSelectedApplication(app);
            setIsDetailOpen(true);
          }}
          onStageChange={handleStageChange}
          onAddNewToStage={(stage) => {
            setEditingApplication({
              company: "",
              role: "",
              stage,
            });
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Add / Edit Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApplication(null);
        }}
        onSave={handleSaveApplication}
        initialData={editingApplication}
        contacts={contacts}
      />

      {/* Detail Slide-over Panel */}
      <DetailPanel
        isOpen={isDetailOpen}
        application={selectedApplication}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedApplication(null);
        }}
        onEdit={(app) => {
          setIsDetailOpen(false);
          setEditingApplication({
            id: app.id,
            company: app.company,
            role: app.role,
            location: app.location,
            jobLink: app.jobLink,
            dateApplied: new Date(app.dateApplied).toISOString().split("T")[0],
            source: app.source || "LinkedIn",
            referred: app.referred,
            referrerContactId: app.referrerContactId,
            stage: app.stage,
            salaryRange: app.salaryRange,
            notes: app.notes,
          });
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteApplication}
        onStageChange={handleStageChange}
        onUpdateNotes={handleUpdateNotes}
      />

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Import Applications from CSV</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a CSV file containing columns like{" "}
              <code className="text-blue-600">Company</code>,{" "}
              <code className="text-blue-600">Role</code>,{" "}
              <code className="text-blue-600">Stage</code>, and{" "}
              <code className="text-blue-600">Job Link</code>.
            </p>

            {importMessage && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs">
                {importMessage}
              </div>
            )}

            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                id="csvFileInput"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
              <label
                htmlFor="csvFileInput"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? "Importing..." : "Choose CSV File"}</span>
              </label>
              <span className="block text-[11px] text-slate-400">
                Supports standard export formats from other job trackers
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
