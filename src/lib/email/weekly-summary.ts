import { prisma } from "@/lib/prisma";

export interface WeeklySummaryData {
  recipientName: string;
  recipientEmail: string;
  appliedCountThisWeek: number;
  totalActiveApplications: number;
  interviewsCount: number;
  assessmentsCount: number;
  offersCount: number;
  pendingFollowUpsCount: number;
  streak: number;
  topTargets: Array<{ name: string; priority: string; targetRole: string | null }>;
  recentApps: Array<{ company: string; role: string; dateApplied: Date }>;
  html: string;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function generateWeeklySummary(
  userId: string,
  appUrl = process.env.APP_URL || "https://applytrack-ten-red.vercel.app"
): Promise<WeeklySummaryData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.email) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentApps, allApps, pendingOutreaches, topTargets] = await Promise.all([
    prisma.application.findMany({
      where: {
        userId,
        dateApplied: { gte: sevenDaysAgo },
      },
      orderBy: { dateApplied: "desc" },
    }),
    prisma.application.findMany({
      where: { userId },
      select: { stage: true },
    }),
    prisma.outreach.findMany({
      where: {
        userId,
        OR: [{ followUpDate: { lte: now } }, { response: "Pending" }],
      },
      include: { contact: true },
      take: 4,
    }),
    prisma.targetCompany.findMany({
      where: { userId, status: "Needs referral" },
      orderBy: { priority: "asc" },
      take: 3,
    }),
  ]);

  const appliedCountThisWeek = recentApps.length;
  const totalActiveApplications = allApps.length;
  const interviewsCount = allApps.filter((a) => a.stage === "Interviewing").length;
  const assessmentsCount = allApps.filter((a) => a.stage === "Assessment").length;
  const offersCount = allApps.filter((a) => a.stage === "Offer").length;
  const pendingFollowUpsCount = pendingOutreaches.length;

  const recipientName = user.name || user.email.split("@")[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your ApplyTrack Weekly Career Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 24px 0; }
    .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .metric-val { font-size: 26px; font-weight: 800; color: #2563eb; }
    .metric-lbl { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px; text-transform: uppercase; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; display: flex; align-items: center; gap: 8px; }
    .app-item { padding: 10px 14px; border-radius: 8px; background: #f1f5f9; margin-bottom: 8px; font-size: 13px; }
    .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 24px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>ApplyTrack Weekly Digest</h1>
      <p>Hello ${esc(recipientName)}, here is your job search summary for the past 7 days.</p>
    </div>
    <div class="content">
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-val">${appliedCountThisWeek}</div>
          <div class="metric-lbl">Applied This Week</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">${interviewsCount}</div>
          <div class="metric-lbl">Active Interviews</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">${assessmentsCount}</div>
          <div class="metric-lbl">Pending Assessments</div>
        </div>
        <div class="metric-box">
          <div class="metric-val" style="color: ${pendingFollowUpsCount > 0 ? "#d97706" : "#10b981"};">${pendingFollowUpsCount}</div>
          <div class="metric-lbl">Follow-ups Due</div>
        </div>
      </div>

      ${
        recentApps.length > 0
          ? `
      <div class="section-title">💼 Applications Submitted This Week</div>
      ${recentApps
        .map(
          (a) =>
            `<div class="app-item"><strong>${esc(a.company)}</strong> — ${esc(a.role)}</div>`
        )
        .join("")}
      `
          : ""
      }

      ${
        pendingFollowUpsCount > 0
          ? `
      <div class="section-title">⚠️ Priority Follow-ups This Week</div>
      ${pendingOutreaches
        .map(
          (o) =>
            `<div class="app-item"><strong>${esc(o.contact.name)}</strong> (${esc(o.contact.company)}) — Contacted via ${esc(o.channel)}</div>`
        )
        .join("")}
      `
          : ""
      }

      ${
        topTargets.length > 0
          ? `
      <div class="section-title">🎯 Target Companies Needing Referrals</div>
      ${topTargets
        .map(
          (t) =>
            `<div class="app-item"><strong>${esc(t.name)}</strong> (${esc(t.priority)} Priority) — ${esc(t.targetRole || "Any Open Role")}</div>`
        )
        .join("")}
      `
          : ""
      }

      <div style="text-align: center;">
        <a href="${esc(appUrl)}/dashboard" class="cta-btn">Open ApplyTrack Dashboard</a>
      </div>
    </div>
    <div class="footer">
      ApplyTrack • Smart Job Application Tracker • Scoped to ${esc(user.email)}
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    recipientName,
    recipientEmail: user.email,
    appliedCountThisWeek,
    totalActiveApplications,
    interviewsCount,
    assessmentsCount,
    offersCount,
    pendingFollowUpsCount,
    streak: 0,
    topTargets,
    recentApps,
    html,
  };
}
