import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Briefcase,
  Target,
  Users,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [appsCount, targetsCount, contactsCount, outreachesCount, recentApps] =
    await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.targetCompany.count({ where: { userId } }),
      prisma.contact.count({ where: { userId } }),
      prisma.outreach.count({ where: { userId } }),
      prisma.application.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  async function seedUserData() {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;
    const uid = userSession.user.id;
    const uName = userSession.user.name || "Test User";

    // Create 1 contact scoped to this user
    const contact = await prisma.contact.create({
      data: {
        userId: uid,
        name: `${uName}'s Referral Contact`,
        company: "Stripe",
        role: "Senior Engineering Manager",
        email: "referrer@stripe.com",
        relationship: "Former Colleague",
        notes: `Private referral connection for ${uName}`,
      },
    });

    // Create 1 target company scoped to this user
    const target = await prisma.targetCompany.create({
      data: {
        userId: uid,
        name: "Google",
        priority: "High",
        targetRole: "Staff Software Engineer",
        status: "Needs referral",
        jobLink: "https://careers.google.com",
        notes: `Target company for user ${uid}`,
      },
    });

    // Create 1 application scoped to this user
    await prisma.application.create({
      data: {
        userId: uid,
        company: "Apple",
        role: "Full Stack Engineer",
        location: "Cupertino, CA (Hybrid)",
        jobLink: "https://apple.com/jobs",
        stage: "Applied",
        source: "Referral",
        referred: true,
        referrerContactId: contact.id,
        salaryRange: "$165k - $195k",
        notes: `Private application created by ${uName}`,
      },
    });

    // Create 1 outreach scoped to this user
    await prisma.outreach.create({
      data: {
        userId: uid,
        contactId: contact.id,
        targetCompanyId: target.id,
        channel: "LinkedIn",
        message: "Hi! Would love to connect regarding the Staff role.",
        response: "Pending",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/applications");
    revalidatePath("/contacts");
    revalidatePath("/targets");
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Security Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 1: Foundation & Auth Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {session.user?.name || "Job Hunter"}!
            </h1>
            <p className="text-blue-100 text-sm max-w-xl">
              ApplyTrack is your intelligent job search control center. All data
              displayed here is strictly isolated and scoped to your account.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/20 text-xs font-medium border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>User Scoped: {session.user?.email}</span>
            </div>
            <span className="text-[11px] text-blue-200">
              User ID: <code className="font-mono">{userId.slice(0, 12)}...</code>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Applications
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {appsCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">scoped</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Target Companies
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {targetsCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">targets</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Contacts
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {contactsCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">network</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Outreach Sent
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {outreachesCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-medium">logged</span>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Data Isolation Test Widget */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Data Isolation Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm multi-tenant database partitioning across user accounts
              </p>
            </div>
          </div>
          <form action={seedUserData}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Seed Test Records for this Account</span>
            </button>
          </form>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Strict User Boundary Enforced</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Every database query is constrained by{" "}
            <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">
              WHERE userId = &apos;{userId}&apos;
            </code>
            . Two test accounts logged into ApplyTrack can never view, query, or
            modify each other&apos;s job applications, target companies, or contacts.
          </p>
        </div>
      </div>

      {/* Recent Applications Scoped to this User */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Applications
          </h2>
          <Link
            href="/applications"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No applications recorded yet for this account.
            </p>
            <p className="text-xs text-slate-400">
              Click &quot;Seed Test Records&quot; above or go to the Applications page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentApps.map((app) => (
              <div
                key={app.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {app.role}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {app.company} {app.location && `• ${app.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    {app.stage}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {new Date(app.dateApplied).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
