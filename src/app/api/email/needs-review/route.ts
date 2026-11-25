import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ExtractedEmailData } from "@/lib/email/email-provider";
import { nextStage, STAGE_FOR_CLASSIFICATION } from "@/lib/email/matching";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.emailEvent.findMany({
    where: {
      userId: session.user.id,
      needsReview: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, action, applicationId, company, role } = await req.json().catch(() => ({}));

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  const event = await prisma.emailEvent.findFirst({
    where: { id: eventId, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (action === "dismiss") {
    await prisma.emailEvent.update({
      where: { id: eventId },
      data: { needsReview: false },
    });
    return NextResponse.json({ success: true, action: "dismissed" });
  }

  if (action === "approve") {
    const classification = event.classification as ExtractedEmailData["classification"];
    let targetAppId: string | null = null;

    if (applicationId) {
      // Linking to an existing application also moves it to the stage this email implies.
      const owned = await prisma.application.findFirst({
        where: { id: String(applicationId), userId: session.user.id },
        select: { id: true, stage: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      targetAppId = owned.id;
      const stage = nextStage(owned.stage, classification);
      if (stage) {
        await prisma.application.update({
          where: { id: owned.id },
          data: {
            stage,
            stageHistory: {
              create: { fromStage: owned.stage, toStage: stage, notes: "Updated from reviewed email" },
            },
          },
        });
      }
    } else {
      const companyName = typeof company === "string" ? company.trim() : "";
      const roleName = typeof role === "string" ? role.trim() : "";
      if (!companyName || !roleName) {
        return NextResponse.json(
          { error: "Company and role are required to create an application" },
          { status: 400 }
        );
      }
      // A rejection or interview email for an untracked application creates it at that stage.
      const stage = STAGE_FOR_CLASSIFICATION[classification] ?? "Applied";
      const newApp = await prisma.application.create({
        data: {
          userId: session.user.id,
          company: companyName.slice(0, 120),
          role: roleName.slice(0, 120),
          stage,
          source: `${event.provider === "gmail" ? "Gmail" : "Outlook"} (Manual Approval)`,
          dateApplied: event.date,
          stageHistory: {
            create: {
              fromStage: null,
              toStage: stage,
              notes: "Created from reviewed email",
            },
          },
        },
      });
      targetAppId = newApp.id;
    }

    await prisma.emailEvent.update({
      where: { id: eventId },
      data: {
        applicationId: targetAppId || null,
        needsReview: false,
      },
    });

    return NextResponse.json({ success: true, action: "approved", applicationId: targetAppId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
