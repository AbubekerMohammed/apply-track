import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  const targetCompanyId = searchParams.get("targetCompanyId");
  const followUpsOnly = searchParams.get("followUpsOnly") === "true";

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (contactId) {
    whereClause.contactId = contactId;
  }

  if (targetCompanyId) {
    whereClause.targetCompanyId = targetCompanyId;
  }

  if (followUpsOnly) {
    whereClause.OR = [
      { followUpDate: { lte: new Date() } },
      { response: "Pending" },
    ];
  }

  const outreaches = await prisma.outreach.findMany({
    where: whereClause,
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          company: true,
          role: true,
          email: true,
          linkedInUrl: true,
        },
      },
      targetCompany: {
        select: {
          id: true,
          name: true,
          priority: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ outreaches });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      contactId,
      targetCompanyId,
      channel,
      date,
      message,
      response,
      followUpDate,
    } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Verify contact belongs to this user
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: session.user.id },
      include: {
        outreaches: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Duplicate outreach detection / warning metadata
    const priorOutreachCount = contact.outreaches.length;
    const isDuplicate = priorOutreachCount > 0;
    const lastOutreach = priorOutreachCount > 0 ? contact.outreaches[0] : null;

    // Default follow-up reminder is 7 days from outreach date if not explicitly set
    const outreachDate = date ? new Date(date) : new Date();
    let finalFollowUpDate: Date | null = null;

    if (followUpDate) {
      finalFollowUpDate = new Date(followUpDate);
    } else {
      const defaultFollowUp = new Date(outreachDate);
      defaultFollowUp.setDate(defaultFollowUp.getDate() + 7);
      finalFollowUpDate = defaultFollowUp;
    }

    const outreach = await prisma.outreach.create({
      data: {
        userId: session.user.id,
        contactId,
        targetCompanyId: targetCompanyId || null,
        channel: channel || "LinkedIn",
        date: outreachDate,
        message: message?.trim() || null,
        response: response || "Pending",
        followUpDate: finalFollowUpDate,
      },
      include: {
        contact: true,
        targetCompany: true,
      },
    });

    // If targetCompanyId was linked, update target company checklist / status
    if (targetCompanyId) {
      const target = await prisma.targetCompany.findFirst({
        where: { id: targetCompanyId, userId: session.user.id },
      });
      if (target) {
        const currentChecklist = (target.checklist as Array<{ id: string; label: string; completed: boolean }>) || [];
        const updatedChecklist = currentChecklist.map((item) =>
          item.id === "send_outreach" ? { ...item, completed: true } : item
        );
        await prisma.targetCompany.update({
          where: { id: targetCompanyId },
          data: {
            checklist: updatedChecklist,
            status: target.status === "Needs referral" ? "Outreach sent" : target.status,
          },
        });
      }
    }

    return NextResponse.json(
      {
        outreach,
        warning: isDuplicate
          ? {
              duplicate: true,
              priorCount: priorOutreachCount,
              lastOutreachDate: lastOutreach?.date,
              lastChannel: lastOutreach?.channel,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
