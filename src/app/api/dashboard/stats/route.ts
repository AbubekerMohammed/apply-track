import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch user settings and all relevant data for this user
  const [user, applications, targetCompanies, outreaches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoal: true },
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

  // 1. STAT CARDS CALCULATION
  const totalApplied = applications.length;
  let assessments = 0;
  let recruiterCalls = 0;
  let interviews = 0;
  let offers = 0;
  let rejections = 0;
  let ghosted = 0;
  let appliedToday = 0;

  // Date map for heatmap & 30-day chart
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

  // 2. STREAK CALCULATION
  let streak = 0;
  const checkDate = new Date(startOfToday);

  // If user applied today, streak starts from today, otherwise check if they applied yesterday
  const todayStr = checkDate.toISOString().split("T")[0];
  let currentDatePointer = new Date(checkDate);

  if (!dateCountsMap[todayStr]) {
    // Check if yesterday had applications
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
  // A. Last 30 Days applications per day
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

  // B. Applied-to-Offer Funnel
  // Stages: Applied, Assessment, Recruiter Call, Interviewing, Offer
  const funnelStages = [
    { stage: "Applied", count: totalApplied },
    { stage: "Assessment", count: assessments },
    { stage: "Recruiter Call", count: recruiterCalls },
    { stage: "Interviewing", count: interviews },
    { stage: "Offer", count: offers },
  ];

  const funnel = funnelStages.map((s) => ({
    ...s,
    percentage: totalApplied > 0 ? Math.round((s.count / totalApplied) * 100) : 0,
  }));

  // C. GitHub-style Heatmap (Past 12 weeks = 84 days)
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

  // 4. TODAY'S FOCUS ITEMS
  const pendingAssessments = applications
    .filter((a) => a.stage === "Assessment")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      company: a.company,
      role: a.role,
      dateApplied: a.dateApplied,
    }));

  const followUpsDue = outreaches.map((o) => ({
    id: o.id,
    contactName: o.contact.name,
    company: o.contact.company,
    channel: o.channel,
    followUpDate: o.followUpDate,
    response: o.response,
  }));

  const referralsNeeded = targetCompanies.map((t) => ({
    id: t.id,
    name: t.name,
    targetRole: t.targetRole,
    priority: t.priority,
    jobLink: t.jobLink,
  }));

  return NextResponse.json({
    stats: {
      applied: totalApplied,
      heardBack,
      assessments,
      recruiterCalls,
      interviews,
      offers,
      rejections,
      ghosted,
      responseRate,
    },
    goal: {
      dailyGoal,
      appliedToday,
      percentage: Math.min(100, Math.round((appliedToday / dailyGoal) * 100)),
      streak,
    },
    charts: {
      applicationsPerDay,
      funnel,
      heatmap,
    },
    todaysFocus: {
      followUpsDue,
      referralsNeeded,
      pendingAssessments,
    },
  });
}
