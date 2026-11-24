import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.application.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const { stage, notes } = await req.json();

    if (!stage) {
      return NextResponse.json({ error: "Stage is required" }, { status: 400 });
    }

    if (existing.stage === stage) {
      return NextResponse.json({ application: existing });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        stage,
        stageHistory: {
          create: {
            fromStage: existing.stage,
            toStage: stage,
            notes: notes || `Moved stage to ${stage}`,
          },
        },
      },
      include: {
        referrerContact: true,
        stageHistory: { orderBy: { changedAt: "desc" } },
        emailEvents: { orderBy: { date: "desc" } },
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error: unknown) {
    console.error("Patch stage error:", error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}
