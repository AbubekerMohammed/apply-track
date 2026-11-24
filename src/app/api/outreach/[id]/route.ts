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
  const existing = await prisma.outreach.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { channel, date, message, response, followUpDate } = body;

    const updated = await prisma.outreach.update({
      where: { id },
      data: {
        ...(channel !== undefined ? { channel } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
        ...(message !== undefined ? { message: message?.trim() || null } : {}),
        ...(response !== undefined ? { response } : {}),
        ...(followUpDate !== undefined
          ? { followUpDate: followUpDate ? new Date(followUpDate) : null }
          : {}),
      },
    });

    return NextResponse.json({ outreach: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
  const existing = await prisma.outreach.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
  }

  await prisma.outreach.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Outreach deleted" });
}
