import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Briefcase, Plus, ExternalLink, Calendar, MapPin, DollarSign, Check, X } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ApplicationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const applications = await prisma.application.findMany({
    where: { userId },
    include: { referrerContact: true },
    orderBy: { createdAt: "desc" },
  });

  async function createApplication(formData: FormData) {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;

    const company = formData.get("company") as string;
    const role = formData.get("role") as string;
    const location = (formData.get("location") as string) || null;
    const jobLink = (formData.get("jobLink") as string) || null;
    const source = (formData.get("source") as string) || "LinkedIn";
    const stage = (formData.get("stage") as string) || "Applied";
    const salaryRange = (formData.get("salaryRange") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const referred = formData.get("referred") === "on";

    if (!company || !role) return;

    await prisma.application.create({
      data: {
        userId: userSession.user.id,
        company,
        role,
        location,
        jobLink,
        source,
        stage,
        salaryRange,
        notes,
        referred,
      },
    });

    revalidatePath("/applications");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Job Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scoped to {session.user?.email} • {applications.length} applications total
          </p>
        </div>
      </div>

      {/* Quick Add Application Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Add New Application</span>
        </h2>
        <form action={createApplication} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Company *
            </label>
            <input
              name="company"
              required
              placeholder="e.g. Google, Stripe, Meta"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role *
            </label>
            <input
              name="role"
              required
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              name="location"
              placeholder="e.g. San Francisco / Remote"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Job Posting Link
            </label>
            <input
              name="jobLink"
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stage
            </label>
            <select
              name="stage"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Applied">Applied</option>
              <option value="Assessment">Assessment</option>
              <option value="Recruiter Call">Recruiter Call</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Ghosted">Ghosted</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Salary Range
            </label>
            <input
              name="salaryRange"
              placeholder="e.g. $160,000 - $190,000"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="referred"
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Referred by a contact</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Save Application
            </button>
          </div>
        </form>
      </div>

      {/* Applications Table / Cards */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Your Applications
        </h2>

        {applications.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No applications in your pipeline yet.
            </p>
            <p className="text-xs text-slate-400">
              Use the form above to add your first application.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Company & Role</th>
                  <th className="pb-3 font-semibold">Stage</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Salary Range</th>
                  <th className="pb-3 font-semibold">Referred</th>
                  <th className="pb-3 font-semibold">Date Applied</th>
                  <th className="pb-3 font-semibold text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {app.company}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {app.role}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        {app.stage}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-600 dark:text-slate-400">
                      {app.location || "—"}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-600 dark:text-slate-400">
                      {app.salaryRange || "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      {app.referred ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <X className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      {app.jobLink ? (
                        <a
                          href={app.jobLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
