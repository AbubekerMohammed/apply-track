import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { GoalRing } from "@/components/dashboard/goal-ring";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { TodaysFocus } from "@/components/dashboard/todays-focus";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch all user scoped metrics in parallel
  const [user, applications, targetCompanies, outreaches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoal: true, name: true, email: true },
    }),
    prisma.application.findMany({
      where: { userId },
      select: {
        id: true,
        company: true,
        role: true,
        stage: true,
        dateApplied: true,
        jobLink: true,
      },
      orderBy: { dateApplied: "asc" },
    }),
    prisma.targetCompany.findMany({
      where: { userId, status: "Needs referral" },
      select: { id: true, name: true, targetRole: true, priority: true, jobLink: true },
      take: 5,
    }),
    prisma.outreach.findMany({
      where: {
        userId,
        OR: [
          { followUpDate: { lte: now } },
          { response: "Pending" },
        ],
      },
      include: {
        contact: { select: { name: true, company: true } },
      },
      take: 5,
    }),
  ]);

  const dailyGoal = user?.dailyGoal || 10;

  // 1. STATS METRICS
  const totalApplied = applications.length;
  let assessments = 0;
  let recruiterCalls = 0;
  let interviews = 0;
  let offers = 0;
  let rejections = 0;
  let ghosted = 0;
  let appliedToday = 0;

  const dateCountsMap: Record<string, number> = {};

  applications.forEach((app) => {
    const dStr = app.dateApplied.toISOString().split("T")[0];
    dateCountsMap[dStr] = (dateCountsMap[dStr] || 0) + 1;

    if (new Date(app.dateApplied) >= startOfToday) {
      appliedToday++;
    }

    switch (app.stage) {
      case "Assessment":
        assessments++;
        break;
      case "Recruiter Call":
        recruiterCalls++;
        break;
      case "Interviewing":
        interviews++;
        break;
      case "Offer":
        offers++;
        break;
      case "Rejected":
        rejections++;
        break;
      case "Ghosted":
        ghosted++;
        break;
    }
  });

  const heardBack = assessments + recruiterCalls + interviews + offers + rejections;
  const responseRate = totalApplied > 0 ? Math.round((heardBack / totalApplied) * 100) : 0;

  // 2. STREAK
  let streak = 0;
  const checkDate = new Date(startOfToday);
  const todayStr = checkDate.toISOString().split("T")[0];
  const currentDatePointer = new Date(checkDate);

  if (!dateCountsMap[todayStr]) {
    currentDatePointer.setDate(currentDatePointer.getDate() - 1);
  }

  while (true) {
    const dStr = currentDatePointer.toISOString().split("T")[0];
    if (dateCountsMap[dStr] && dateCountsMap[dStr] > 0) {
      streak++;
      currentDatePointer.setDate(currentDatePointer.getDate() - 1);
    } else {
      break;
    }
  }

  // 3. CHARTS DATA
  // 30 Days applications per day
  const applicationsPerDay = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    applicationsPerDay.push({
      date: dateStr,
      label,
      count: dateCountsMap[dateStr] || 0,
    });
  }

  // Funnel
  const funnel = [
    { stage: "Applied", count: totalApplied, percentage: totalApplied > 0 ? 100 : 0 },
    {
      stage: "Assessment",
      count: assessments,
      percentage: totalApplied > 0 ? Math.round((assessments / totalApplied) * 100) : 0,
    },
    {
      stage: "Recruiter Call",
      count: recruiterCalls,
      percentage: totalApplied > 0 ? Math.round((recruiterCalls / totalApplied) * 100) : 0,
    },
    {
      stage: "Interviewing",
      count: interviews,
      percentage: totalApplied > 0 ? Math.round((interviews / totalApplied) * 100) : 0,
    },
    {
      stage: "Offer",
      count: offers,
      percentage: totalApplied > 0 ? Math.round((offers / totalApplied) * 100) : 0,
    },
  ];

  // Heatmap
  const heatmap = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = dateCountsMap[dateStr] || 0;

    let level = 0;
    if (count >= 5) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;

    heatmap.push({
      date: dateStr,
      count,
      level,
      weekday: d.getDay(),
    });
  }

  // 4. FOCUS ITEMS
  const pendingAssessments = applications
    .filter((a) => a.stage === "Assessment")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      company: a.company,
      role: a.role,
      dateApplied: a.dateApplied.toISOString(),
    }));

  const followUpsDue = outreaches.map((o) => ({
    id: o.id,
    contactName: o.contact.name,
    company: o.contact.company,
    channel: o.channel,
    followUpDate: o.followUpDate ? o.followUpDate.toISOString() : null,
    response: o.response,
  }));

  const referralsNeeded = targetCompanies.map((t) => ({
    id: t.id,
    name: t.name,
    targetRole: t.targetRole,
    priority: t.priority,
    jobLink: t.jobLink,
  }));

  const goalPercentage = Math.min(100, Math.round((appliedToday / dailyGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Job Search Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user?.name || "Active Search"} &bull; {totalApplied} total applications logged &bull; {appliedToday}/{dailyGoal} applied today
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
          >
            <span>Sync Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Row + Goal Ring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 8 Stat Cards (3 Cols) */}
        <div className="lg:col-span-3">
          <StatCards
            stats={{
              applied: totalApplied,
              heardBack,
              assessments,
              recruiterCalls,
              interviews,
              offers,
              rejections,
              ghosted,
              responseRate,
            }}
          />
        </div>

        {/* Right: Daily Goal Ring (1 Col) */}
        <div className="lg:col-span-1">
          <GoalRing
            dailyGoal={dailyGoal}
            appliedToday={appliedToday}
            percentage={goalPercentage}
            streak={streak}
          />
        </div>
      </div>

      {/* Today's Focus Panel */}
      <TodaysFocus
        followUpsDue={followUpsDue}
        referralsNeeded={referralsNeeded}
        pendingAssessments={pendingAssessments}
      />

      {/* Charts: Velocity, Funnel, Heatmap */}
      <DashboardCharts
        applicationsPerDay={applicationsPerDay}
        funnel={funnel}
        heatmap={heatmap}
      />
    </div>
  );
}
