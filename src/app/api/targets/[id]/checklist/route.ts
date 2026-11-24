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
  const target = await prisma.targetCompany.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!target) {
    return NextResponse.json({ error: "Target company not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    // body can be { itemId: string, completed: boolean } or { checklist: [...] }
    let updatedChecklist: Array<{ id: string; label: string; completed: boolean }>;

    if (body.checklist && Array.isArray(body.checklist)) {
      updatedChecklist = body.checklist;
    } else if (body.itemId !== undefined && body.completed !== undefined) {
      const current = (target.checklist as Array<{ id: string; label: string; completed: boolean }>) || [];
      updatedChecklist = current.map((item) =>
        item.id === body.itemId ? { ...item, completed: Boolean(body.completed) } : item
      );
    } else {
      return NextResponse.json(
        { error: "Invalid checklist payload. Provide itemId/completed or checklist array." },
        { status: 400 }
      );
    }

    // Auto-update status if needed (e.g. if referral step completed or apply step completed)
    let autoStatus = target.status;
    const referralDone = updatedChecklist.find((i) => i.id === "get_referral")?.completed;
    const appliedDone = updatedChecklist.find((i) => i.id === "apply")?.completed;
    const outreachDone = updatedChecklist.find((i) => i.id === "send_outreach")?.completed;

    if (appliedDone) {
      autoStatus = "Applied";
    } else if (referralDone) {
      autoStatus = "Referral secured";
    } else if (outreachDone && target.status === "Needs referral") {
      autoStatus = "Outreach sent";
    }

    const updated = await prisma.targetCompany.update({
      where: { id },
      data: {
        checklist: updatedChecklist,
        status: autoStatus,
      },
    });

    return NextResponse.json({
      success: true,
      target: updated,
      checklist: updated.checklist,
      status: updated.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
