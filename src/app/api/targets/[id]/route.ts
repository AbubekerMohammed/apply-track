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
  const target = await prisma.targetCompany.findFirst({
    where: { id, userId: session.user.id },
    include: {
      outreaches: {
        include: {
          contact: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Target company not found" }, { status: 404 });
  }

  return NextResponse.json({ target });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.targetCompany.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Target company not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, targetRole, priority, status, jobLink, notes, checklist } = body;

    const updated = await prisma.targetCompany.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(targetRole !== undefined ? { targetRole: targetRole?.trim() || null } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(jobLink !== undefined ? { jobLink: jobLink?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(checklist !== undefined ? { checklist } : {}),
      },
    });

    return NextResponse.json({ target: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
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
  const existing = await prisma.targetCompany.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Target company not found" }, { status: 404 });
  }

  await prisma.targetCompany.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Target company deleted" });
}
