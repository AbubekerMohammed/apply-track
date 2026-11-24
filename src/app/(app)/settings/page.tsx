import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Settings, User, Mail, Moon, Sun, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { InboxConnections } from "@/components/settings/inbox-connections";
import { NeedsReviewQueue } from "@/components/settings/needs-review-queue";
import { WeeklyDigestSettings } from "@/components/settings/weekly-digest-settings";
import { revalidatePath } from "next/cache";
import { isProviderConfigured, MAIL_PROVIDERS } from "@/lib/email/oauth";

const MAIL_ERRORS: Record<string, string> = {
  denied: "Permission was not granted, so the inbox wasn't connected.",
  invalid_state: "The connection request expired. Please try connecting again.",
  connect_failed: "We couldn't finish connecting the inbox. Please try again.",
  not_configured: "This inbox provider isn't available yet.",
  invalid_provider: "Unknown inbox provider.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const mailConnected = one(params.mailConnected);
  const mailError = one(params.mailError);
  const notice = mailConnected
    ? {
        kind: "success" as const,
        text: `${mailConnected === "gmail" ? "Gmail" : "Outlook"} connected. Your recent job emails have been imported.`,
      }
    : mailError
      ? { kind: "error" as const, text: MAIL_ERRORS[mailError] ?? "Inbox connection failed." }
      : null;

  const [user, reviewItems, userApplications, mailAccounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.emailEvent.findMany({
      where: { userId, needsReview: true },
      orderBy: { date: "desc" },
    }),
    prisma.application.findMany({
      where: { userId },
      select: { id: true, company: true, role: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.account.findMany({
      where: { userId, provider: { in: MAIL_PROVIDERS } },
      select: { provider: true, providerAccountId: true },
    }),
  ]);

  const mailbox = (provider: "gmail" | "outlook") => {
    const account = mailAccounts.find((a) => a.provider === provider);
    return {
      connected: Boolean(account),
      address: account?.providerAccountId ?? null,
      configured: isProviderConfigured(provider),
    };
  };

  async function updateDailyGoal(formData: FormData) {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;

    const goal = parseInt(formData.get("dailyGoal") as string, 10);
    if (isNaN(goal) || goal < 1 || goal > 100) return;

    await prisma.user.update({
      where: { id: userSession.user.id },
      data: { dailyGoal: goal },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }

  const serializedReviewItems = reviewItems.map((item) => ({
    ...item,
    date: item.date.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Workspace</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200">Settings</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Settings & Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your connected inboxes, classification review queue, and daily targets
        </p>
      </div>

      {/* Gmail & Outlook Inbox Connections */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Connected Inboxes (Gmail & Outlook)</span>
        </h2>
        <InboxConnections gmail={mailbox("gmail")} outlook={mailbox("outlook")} notice={notice} />
      </div>

      {/* Needs Review Queue */}
      <NeedsReviewQueue
        initialItems={serializedReviewItems}
        userApplications={userApplications}
      />

      {/* Profile Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Profile Information</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-400 block mb-0.5">Full Name</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {user?.name || "Not provided"}
            </span>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-400 block mb-0.5">Email Address</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Goal Settings */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Daily Goals Preference</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Set your daily job application target (default 10). This drives the daily goal ring on your dashboard.
        </p>
        <form action={updateDailyGoal} className="flex items-center gap-3 max-w-sm">
          <input
            name="dailyGoal"
            type="number"
            min="1"
            max="100"
            defaultValue={user?.dailyGoal || 10}
            className="w-28 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-xs transition-colors shadow-xs"
          >
            Save Goal
          </button>
        </form>
      </div>

      {/* Smart Features: Weekly Email Digest & Auto-Ghosting */}
      <WeeklyDigestSettings />

      {/* Appearance & Dark Mode Card */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Appearance & Dark Mode</span>
        </h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
              Theme Mode
            </span>
            <span className="text-xs text-slate-400">
              Toggle between light and dark themes
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
