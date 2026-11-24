import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const relationship = searchParams.get("relationship");

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (relationship && relationship !== "all") {
    whereClause.relationship = relationship;
  }

  let contacts = await prisma.contact.findMany({
    where: whereClause,
    include: {
      outreaches: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          channel: true,
          date: true,
          message: true,
          response: true,
          followUpDate: true,
          targetCompany: {
            select: { id: true, name: true },
          },
        },
      },
      applicationsReferred: {
        select: {
          id: true,
          company: true,
          role: true,
          stage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (search) {
    contacts = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search) ||
        (c.role && c.role.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, company, role, email, linkedInUrl, relationship, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Contact name is required" },
        { status: 400 }
      );
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        company: company.trim(),
        role: role?.trim() || null,
        email: email?.trim() || null,
        linkedInUrl: linkedInUrl?.trim() || null,
        relationship: relationship || "Colleague",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
