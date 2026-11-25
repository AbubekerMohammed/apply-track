import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const { eventId, action, applicationId, company, role, stage } = await req
    .json()
    .catch(() => ({}));

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
    let targetAppId: string | null = null;

    if (applicationId) {
      const owned = await prisma.application.findFirst({
        where: { id: String(applicationId), userId: session.user.id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      targetAppId = owned.id;
    }

    // If creating a brand new application from this email
    if (!targetAppId && company) {
      const newApp = await prisma.application.create({
        data: {
          userId: session.user.id,
          company,
          role: role || "Software Engineer",
          stage: stage || "Applied",
          source: `${event.provider.toUpperCase()} (Manual Approval)`,
          dateApplied: event.date,
          stageHistory: {
            create: {
              fromStage: null,
              toStage: stage || "Applied",
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
