"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  UserCheck,
  DollarSign,
  Plus,
} from "lucide-react";
import { ApplicationDetail } from "./detail-panel";
import { STAGES } from "./application-modal";

interface KanbanViewProps {
  applications: ApplicationDetail[];
  onSelectApplication: (app: ApplicationDetail) => void;
  onStageChange: (id: string, newStage: string) => Promise<void>;
  onAddNewToStage?: (stage: string) => void;
}

export function KanbanView({
  applications,
  onSelectApplication,
  onStageChange,
  onAddNewToStage,
}: KanbanViewProps) {
  const [draggedAppId, setDraggedAppId] = React.useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = React.useState<string | null>(null);

  const stageBadgeColors: Record<string, { bg: string; text: string; dot: string }> = {
    Applied: {
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
      text: "text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
    },
    Assessment: {
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900",
      text: "text-purple-700 dark:text-purple-300",
      dot: "bg-purple-500",
    },
    "Recruiter Call": {
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    Interviewing: {
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900",
      text: "text-indigo-700 dark:text-indigo-300",
      dot: "bg-indigo-500",
    },
    Offer: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    Rejected: {
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900",
      text: "text-rose-700 dark:text-rose-300",
      dot: "bg-rose-500",
    },
    Ghosted: {
      bg: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
      text: "text-slate-700 dark:text-slate-300",
      dot: "bg-slate-400",
    },
  };

  function handleDragStart(e: React.DragEvent, appId: string) {
    e.dataTransfer.setData("text/plain", appId);
    setDraggedAppId(appId);
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (activeDropStage !== stage) {
      setActiveDropStage(stage);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    setActiveDropStage(null);
    const appId = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (!appId) return;

    const app = applications.find((a) => a.id === appId);
    if (app && app.stage !== targetStage) {
      await onStageChange(appId, targetStage);
    }
    setDraggedAppId(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
      {STAGES.map((stage) => {
        const stageApps = applications.filter((a) => a.stage === stage);
        const style = stageBadgeColors[stage] || stageBadgeColors.Applied;
        const isHovered = activeDropStage === stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
            className={`w-72 shrink-0 flex flex-col rounded-xl border transition-all duration-150 snap-start bg-slate-50/70 dark:bg-slate-900/40 ${
              isHovered
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
                : "border-slate-200/80 dark:border-slate-800"
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {stage}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {stageApps.length}
                </span>
                {onAddNewToStage && (
                  <button
                    onClick={() => onAddNewToStage(stage)}
                    title={`Add application to ${stage}`}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Droppable Card List */}
            <div className="flex-1 p-2.5 space-y-2.5 min-h-[420px] max-h-[calc(100vh-280px)] overflow-y-auto">
              {stageApps.map((app) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onClick={() => onSelectApplication(app)}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-all space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {app.role}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{app.company}</span>
                      </div>
                    </div>
                    {app.jobLink && (
                      <a
                        href={app.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Open job link in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {app.location && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{app.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(app.dateApplied).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {app.salaryRange && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {app.salaryRange}
                        </span>
                      )}
                      {app.referred && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                          Referred
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {stageApps.length === 0 && (
                <div className="h-28 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400 font-medium">
                  Drop cards here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
