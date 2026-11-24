import { prisma } from "@/lib/prisma";

export interface AIQueryResponse {
  answer: string;
  category: "applications_count" | "follow_ups" | "targets" | "response_rate" | "general";
  dataPoints?: Record<string, unknown>;
  suggestedActions?: Array<{ label: string; href: string }>;
}

export async function processAICareerQuery(userId: string, question: string): Promise<AIQueryResponse> {
  const normalized = question.toLowerCase().trim();
  const now = new Date();

  // 1. "How many did I apply to last week?" / "applications last week"
  if (
    normalized.includes("last week") ||
    (normalized.includes("apply") && normalized.includes("past week"))
  ) {
    const today = new Date();
    // End of last week: 7 days ago
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(startOfToday);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const appsLastWeek = await prisma.application.findMany({
      where: {
        userId,
        dateApplied: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
      orderBy: { dateApplied: "desc" },
    });

    const count = appsLastWeek.length;
    let answer = `You submitted **${count} job application${count === 1 ? "" : "s"}** last week (${fourteenDaysAgo.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${sevenDaysAgo.toLocaleDateString(undefined, { month: "short", day: "numeric" })}).`;

    if (count > 0) {
      const companiesList = appsLastWeek.map((a) => `• **${a.company}** — ${a.role} (${a.stage})`).join("\n");
      answer += `\n\nHere is the breakdown:\n${companiesList}`;
    } else {
      answer += "\n\n💡 Tip: Consider dedicating time this week to search and apply to targets or request referrals!";
    }

    return {
      answer,
      category: "applications_count",
      dataPoints: { count, apps: appsLastWeek.map((a) => a.company) },
      suggestedActions: [
        { label: "View Applications", href: "/applications" },
        { label: "Check Targets", href: "/targets" },
      ],
    };
  }

  // 2. "How many did I apply to this week / today?" / "recent applications"
  if (
    normalized.includes("this week") ||
    normalized.includes("today") ||
    (normalized.includes("how many") && normalized.includes("apply"))
  ) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const appsThisWeek = await prisma.application.findMany({
      where: {
        userId,
        dateApplied: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { dateApplied: "desc" },
    });

    const totalAllTime = await prisma.application.count({ where: { userId } });
    const count = appsThisWeek.length;

    let answer = `You have submitted **${count} application${count === 1 ? "" : "s"}** over the past 7 days (out of **${totalAllTime}** total all-time).`;
    if (count > 0) {
      const list = appsThisWeek.slice(0, 5).map((a) => `• **${a.company}** — ${a.role}`).join("\n");
      answer += `\n\nRecent submissions:\n${list}${count > 5 ? `\n...and ${count - 5} more.` : ""}`;
    }

    return {
      answer,
      category: "applications_count",
      dataPoints: { count, totalAllTime },
      suggestedActions: [{ label: "View All Applications", href: "/applications" }],
    };
  }

  // 3. "Who should I follow up with?" / "follow ups" / "pending outreach"
  if (
    normalized.includes("follow up") ||
    normalized.includes("who should i contact") ||
    normalized.includes("outreach") ||
    normalized.includes("who should i message")
  ) {
    const pendingOutreaches = await prisma.outreach.findMany({
      where: {
        userId,
        OR: [
          { followUpDate: { lte: now } },
          { response: "Pending" },
        ],
      },
      include: {
        contact: true,
        targetCompany: true,
      },
      orderBy: { date: "asc" },
      take: 6,
    });

    if (pendingOutreaches.length === 0) {
      return {
        answer: "Great news! You have **no pending follow-ups** due right now. All your logged outreaches have received replies or have future follow-up dates scheduled.",
        category: "follow_ups",
        suggestedActions: [
          { label: "Find New Contacts", href: "/contacts" },
          { label: "View Targets", href: "/targets" },
        ],
      };
    }

    const items = pendingOutreaches.map((o) => {
      const daysSince = Math.round((now.getTime() - new Date(o.date).getTime()) / (1000 * 3600 * 24));
      const isOverdue = o.followUpDate && new Date(o.followUpDate) <= now;
      return `• **${o.contact.name}** at **${o.contact.company}** (${o.channel}) — Contacted ${daysSince} day${daysSince === 1 ? "" : "s"} ago. ${
        isOverdue ? "⚠️ **Follow-up is due now!**" : "Awaiting response."
      }`;
    });

    const answer = `You have **${pendingOutreaches.length} contact${pendingOutreaches.length === 1 ? "" : "s"}** recommended for follow-up:\n\n${items.join(
      "\n"
    )}\n\n💡 *Pro-tip: A polite 1-2 sentence follow-up on LinkedIn or email after 5-7 business days boosts reply rates by up to 40%.*`;

    return {
      answer,
      category: "follow_ups",
      dataPoints: { count: pendingOutreaches.length },
      suggestedActions: [
        { label: "Open Contacts Page", href: "/contacts" },
        { label: "Check Dashboard Focus", href: "/dashboard" },
      ],
    };
  }

  // 4. "Which target companies still need a referral?" / "referrals needed"
  if (
    normalized.includes("referral") ||
    normalized.includes("target") ||
    normalized.includes("need referral")
  ) {
    const needRefTargets = await prisma.targetCompany.findMany({
      where: {
        userId,
        status: "Needs referral",
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    if (needRefTargets.length === 0) {
      return {
        answer: "All your saved target companies already have outreach sent, referrals secured, or applications submitted! None currently need initial referral hunting.",
        category: "targets",
        suggestedActions: [{ label: "View Targets", href: "/targets" }],
      };
    }

    const list = needRefTargets.map((t) => {
      return `• **${t.name}** (${t.priority} Priority) — Target Role: ${t.targetRole || "General"}`;
    });

    const answer = `You have **${needRefTargets.length} target compan${needRefTargets.length === 1 ? "y" : "ies"}** marked as **"Needs referral"**:\n\n${list.join(
      "\n"
    )}\n\n🎯 *Next step: Check LinkedIn for 1st or 2nd-degree connections or alumni at these companies before submitting a cold application.*`;

    return {
      answer,
      category: "targets",
      dataPoints: { count: needRefTargets.length },
      suggestedActions: [
        { label: "Explore Targets & Checklist", href: "/targets" },
        { label: "Search Contacts", href: "/contacts" },
      ],
    };
  }

  // 5. "What is my response rate?" / "stats" / "conversion"
  if (
    normalized.includes("response rate") ||
    normalized.includes("conversion") ||
    normalized.includes("rate") ||
    normalized.includes("how am i doing")
  ) {
    const allApps = await prisma.application.findMany({
      where: { userId },
      select: { stage: true },
    });

    const total = allApps.length;
    const assessments = allApps.filter((a) => a.stage === "Assessment").length;
    const recruiterCalls = allApps.filter((a) => a.stage === "Recruiter Call").length;
    const interviews = allApps.filter((a) => a.stage === "Interviewing").length;
    const offers = allApps.filter((a) => a.stage === "Offer").length;
    const rejections = allApps.filter((a) => a.stage === "Rejected").length;
    const heardBack = assessments + recruiterCalls + interviews + offers + rejections;
    const rate = total > 0 ? Math.round((heardBack / total) * 100) : 0;

    const answer = `Your current response rate is **${rate}%** (${heardBack} responses from ${total} total applications).\n\n• **Offers:** ${offers}\n• **Active Interviews:** ${interviews}\n• **Recruiter Calls:** ${recruiterCalls}\n• **Assessments:** ${assessments}\n• **Rejections:** ${rejections}\n\n${
      rate >= 20
        ? "🌟 Excellent momentum! That is well above the industry average of 10-15%."
        : "📈 Keep refining your resume keywords and seeking referrals to push your response rate above 20%."
    }`;

    return {
      answer,
      category: "response_rate",
      dataPoints: { rate, total, heardBack, offers, interviews },
      suggestedActions: [{ label: "View Analytics Dashboard", href: "/dashboard" }],
    };
  }

  // 6. General pipeline overview / fallback
  const [totalApps, pendingFollowUpsCount, targetNeedsRefCount] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.outreach.count({
      where: {
        userId,
        OR: [{ followUpDate: { lte: now } }, { response: "Pending" }],
      },
    }),
    prisma.targetCompany.count({
      where: { userId, status: "Needs referral" },
    }),
  ]);

  const answer = `Here is your current **ApplyTrack Career Summary**:\n\n• **${totalApps}** total applications in your pipeline\n• **${pendingFollowUpsCount}** outreach follow-ups requiring your attention\n• **${targetNeedsRefCount}** target companies waiting for referrals\n\nYou can ask me specific questions anytime, such as:\n- *"How many did I apply to last week?"*\n- *"Who should I follow up with?"*\n- *"Which target companies still need a referral?"*\n- *"What is my response rate?"*`;

  return {
    answer,
    category: "general",
    suggestedActions: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Applications", href: "/applications" },
      { label: "Contacts", href: "/contacts" },
    ],
  };
}
