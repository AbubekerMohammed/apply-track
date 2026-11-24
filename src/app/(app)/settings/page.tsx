import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Settings, User, Mail, Moon, Sun, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  async function updateDailyGoal(formData: FormData) {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;

    const goal = parseInt(formData.get("dailyGoal") as string, 10);
    if (isNaN(goal) || goal < 1) return;

    await prisma.user.update({
      where: { id: userSession.user.id },
      data: { dailyGoal: goal },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal profile, search targets, and notification settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Profile Information</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-400 block mb-0.5">Full Name</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || "Not provided"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-400 block mb-0.5">Email Address</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.email}
            </span>
          </div>
          <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-400 block mb-0.5">User ID (Data Scope Key)</span>
            <code className="text-xs font-mono text-slate-600 dark:text-slate-300">
              {user?.id}
            </code>
          </div>
        </div>
      </div>

      {/* Daily Goal Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>Daily Goals Preference</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Set your daily job application target (default 10). This drives the daily goal ring in Phase 3.
        </p>
        <form action={updateDailyGoal} className="flex items-center gap-3 max-w-sm">
          <input
            name="dailyGoal"
            type="number"
            min="1"
            max="100"
            defaultValue={user?.dailyGoal || 10}
            className="w-28 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Save Goal
          </button>
        </form>
      </div>

      {/* Appearance & Dark Mode Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-600" />
          <span>Appearance & Dark Mode</span>
        </h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
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

      {/* Connected Inboxes Preview (Phases 4 & 5) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
          <span>Connected Inboxes</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Email sync with Gmail & Outlook will be activated in Phases 4 & 5.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div>
                <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                  Gmail Integration
                </span>
                <span className="text-[11px] text-slate-400">
                  {user?.gmailConnected ? "Connected" : "Phase 4 Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold text-xs">
                O
              </div>
              <div>
                <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                  Outlook Integration
                </span>
                <span className="text-[11px] text-slate-400">
                  {user?.outlookConnected ? "Connected" : "Phase 5 Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
