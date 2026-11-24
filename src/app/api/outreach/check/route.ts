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

  if (!contactId) {
    return NextResponse.json({ error: "contactId query parameter required" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: session.user.id },
    include: {
      outreaches: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          channel: true,
          date: true,
          response: true,
          message: true,
          followUpDate: true,
        },
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const count = contact.outreaches.length;
  const hasContacted = count > 0;
  const lastOutreach = count > 0 ? contact.outreaches[0] : null;

  return NextResponse.json({
    hasContacted,
    count,
    lastOutreach,
    contactName: contact.name,
    company: contact.company,
  });
}
