import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateWeeklySummary } from "@/lib/email/weekly-summary";
import { isMailerConfigured, sendEmail } from "@/lib/email/mailer";
import { appBaseUrl } from "@/lib/email/oauth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const digest = await generateWeeklySummary(session.user.id, appBaseUrl(req));
  if (!digest) {
    return NextResponse.json({ error: "Could not generate digest" }, { status: 404 });
  }

  return new NextResponse(digest.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // The preview is static markup; forbid scripts as defense in depth.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:",
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMailerConfigured()) {
    return NextResponse.json(
      { error: "Email delivery isn't set up yet. You can still preview the digest." },
      { status: 503 }
    );
  }

  try {
    const digest = await generateWeeklySummary(session.user.id, appBaseUrl(req));
    if (!digest) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = `Your Traill Weekly Digest: ${digest.appliedCountThisWeek} applied this week`;
    await sendEmail({ to: digest.recipientEmail, subject, html: digest.html });

    return NextResponse.json({
      success: true,
      recipientEmail: digest.recipientEmail,
      subject,
      sentAt: new Date().toISOString(),
      message: `Weekly summary sent to ${digest.recipientEmail}.`,
    });
  } catch (err: unknown) {
    console.error("Weekly summary send failed:", err);
    return NextResponse.json({ error: "Could not send the weekly summary. Please try again." }, { status: 502 });
  }
}
