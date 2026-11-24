import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    include: {
      referrerContact: true,
      stageHistory: { orderBy: { changedAt: "desc" } },
      emailEvents: { orderBy: { date: "desc" } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PUT(
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

    const body = await req.json();
    const {
      company,
      role,
      location,
      jobLink,
      dateApplied,
      source,
      referred,
      referrerContactId,
      stage,
      salaryRange,
      notes,
    } = body;

    const stageChanged = stage && stage !== existing.stage;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(company !== undefined ? { company: company.trim() } : {}),
        ...(role !== undefined ? { role: role.trim() } : {}),
        ...(location !== undefined ? { location: location?.trim() || null } : {}),
        ...(jobLink !== undefined ? { jobLink: jobLink?.trim() || null } : {}),
        ...(dateApplied !== undefined ? { dateApplied: new Date(dateApplied) } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(referred !== undefined ? { referred: Boolean(referred) } : {}),
        ...(referrerContactId !== undefined ? { referrerContactId: referrerContactId || null } : {}),
        ...(stage !== undefined ? { stage } : {}),
        ...(salaryRange !== undefined ? { salaryRange: salaryRange?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(stageChanged
          ? {
              stageHistory: {
                create: {
                  fromStage: existing.stage,
                  toStage: stage,
                  notes: `Stage updated from ${existing.stage} to ${stage}`,
                },
              },
            }
          : {}),
      },
      include: {
        referrerContact: true,
        stageHistory: { orderBy: { changedAt: "desc" } },
        emailEvents: { orderBy: { date: "desc" } },
      },
    });

    return NextResponse.json({ application });
  } catch (error: unknown) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
