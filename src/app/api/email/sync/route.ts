import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";
import { processAndSyncEmails } from "@/lib/email/sync-engine";
import { NormalizedEmailMessage } from "@/lib/email/email-provider";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDemoMode()) {
    return NextResponse.json({ error: "Inbox sync not available yet" }, { status: 501 });
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gmailConnected: true, outlookConnected: true },
  });

  if (!user?.gmailConnected && !user?.outlookConnected) {
    return NextResponse.json(
      { error: "No inbox connected. Please connect Gmail or Outlook in Settings." },
      { status: 400 }
    );
  }

  // Parse optional custom messages passed in body (for testing or real webhook)
  let customMessages: NormalizedEmailMessage[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.messages)) {
      customMessages = body.messages;
    }
  } catch {
    // No body passed
  }

  const messagesToSync: NormalizedEmailMessage[] = [...customMessages];

  // If syncing Gmail and no custom messages passed, generate default mock job events for Gmail
  if (user.gmailConnected && customMessages.length === 0) {
    const now = new Date();
    messagesToSync.push(
      {
        provider: "gmail",
        messageId: `gmail-conf-${now.getTime()}-1`,
        date: new Date(now.getTime() - 2 * 3600 * 1000),
        sender: "Uber Recruiting <careers@uber.com>",
        subject: "Thank you for applying to Uber - Senior Software Engineer",
        snippet:
          "We have received your application for the Senior Software Engineer role at Uber. Our recruiting team will review your qualifications.",
      },
      {
        provider: "gmail",
        messageId: `gmail-oa-${now.getTime()}-2`,
        date: new Date(now.getTime() - 1 * 3600 * 1000),
        sender: "CodeSignal on behalf of Uber <notifications@codesignal.com>",
        subject: "Coding Assessment Invitation - Uber General Coding Framework",
        snippet:
          "You have been invited by Uber to complete the CodeSignal technical assessment for Senior Software Engineer. You have 70 minutes to finish.",
      },
      {
        provider: "gmail",
        messageId: `gmail-lowconf-${now.getTime()}-3`,
        date: new Date(now.getTime() - 30 * 60 * 1000),
        sender: "Talent Acquisition <info@quickcareers.net>",
        subject: "Update regarding position",
        snippet:
          "We wanted to follow up on your recent inquiry. Please check the portal for next steps.",
      }
    );
  }

  // If syncing Outlook and no custom messages passed, generate mock job events for Outlook
  if (user.outlookConnected && customMessages.length === 0) {
    const now = new Date();
    messagesToSync.push(
      {
        provider: "outlook",
        messageId: `outlook-rej-${now.getTime()}-1`,
        date: new Date(now.getTime() - 4 * 3600 * 1000),
        sender: "Netflix Talent <jobs@netflix.com>",
        subject: "Your application to Netflix",
        snippet:
          "Thank you for your interest in Netflix. After careful consideration, we have decided to pursue other candidates whose experience more closely matches.",
      },
      {
        provider: "outlook",
        messageId: `outlook-offer-${now.getTime()}-2`,
        date: new Date(now.getTime() - 15 * 60 * 1000),
        sender: "Figma People Team <talent@figma.com>",
        subject: "Offer of Employment - Figma Design Systems Engineer",
        snippet:
          "We are thrilled to offer you the position of Design Systems Engineer at Figma! Please review the attached formal offer letter and compensation package.",
      }
    );
  }

  const result = await processAndSyncEmails(userId, messagesToSync);

  return NextResponse.json({
    success: true,
    result,
  });
}
