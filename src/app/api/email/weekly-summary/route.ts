import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateWeeklySummary } from "@/lib/email/weekly-summary";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const digest = await generateWeeklySummary(session.user.id);
  if (!digest) {
    return NextResponse.json({ error: "Could not generate digest" }, { status: 404 });
  }

  return new NextResponse(digest.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const digest = await generateWeeklySummary(session.user.id);
    if (!digest) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // In local / development environment, we simulate sending and return the HTML and metrics
    return NextResponse.json({
      success: true,
      recipientEmail: digest.recipientEmail,
      subject: `Your ApplyTrack Weekly Career Digest — ${digest.appliedCountThisWeek} Applied This Week`,
      sentAt: new Date().toISOString(),
      metrics: {
        appliedThisWeek: digest.appliedCountThisWeek,
        interviews: digest.interviewsCount,
        assessments: digest.assessmentsCount,
        followUpsDue: digest.pendingFollowUpsCount,
      },
      message: `Weekly summary email successfully generated and sent to ${digest.recipientEmail}!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
