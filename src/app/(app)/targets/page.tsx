import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Target, Plus, Building2, ExternalLink } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function TargetsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const targets = await prisma.targetCompany.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  async function createTarget(formData: FormData) {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;

    const name = formData.get("name") as string;
    const targetRole = (formData.get("targetRole") as string) || null;
    const priority = (formData.get("priority") as string) || "Medium";
    const status = (formData.get("status") as string) || "Needs referral";
    const jobLink = (formData.get("jobLink") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!name) return;

    await prisma.targetCompany.create({
      data: {
        userId: userSession.user.id,
        name,
        targetRole,
        priority,
        status,
        jobLink,
        notes,
      },
    });

    revalidatePath("/targets");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Targets & Referrals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scoped to {session.user?.email} • {targets.length} target companies
          </p>
        </div>
      </div>

      {/* Add Target Company Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Add Target Company</span>
        </h2>
        <form action={createTarget} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Company Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. OpenAI, Anthropic, Datadog"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Role
            </label>
            <input
              name="targetRole"
              placeholder="e.g. Staff Engineer"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Referral Status
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Needs referral">Needs referral</option>
              <option value="Outreach sent">Outreach sent</option>
              <option value="Referral secured">Referral secured</option>
              <option value="Applied">Applied</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Job / Careers Link
            </label>
            <input
              name="jobLink"
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Save Target Company
            </button>
          </div>
        </form>
      </div>

      {/* Target Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.length === 0 ? (
          <div className="col-span-full py-12 text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No target companies added yet for this account.
            </p>
          </div>
        ) : (
          targets.map((target) => (
            <div
              key={target.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {target.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {target.targetRole || "General Role"}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    target.priority === "High"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                      : target.priority === "Medium"
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {target.priority} Priority
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {target.status}
                </span>
                {target.jobLink && (
                  <a
                    href={target.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span>Careers</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
