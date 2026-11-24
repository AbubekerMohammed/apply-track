import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CHECKLIST = [
  { id: "find_contact", label: "Find a contact", completed: false },
  { id: "send_outreach", label: "Send outreach", completed: false },
  { id: "follow_up", label: "Follow up", completed: false },
  { id: "get_referral", label: "Get the referral", completed: false },
  { id: "apply", label: "Apply", completed: false },
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase().trim();

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (priority && priority !== "all") {
    whereClause.priority = priority;
  }

  if (status && status !== "all") {
    whereClause.status = status;
  }

  let targets = await prisma.targetCompany.findMany({
    where: whereClause,
    include: {
      outreaches: {
        select: {
          id: true,
          channel: true,
          date: true,
          response: true,
          contact: {
            select: { id: true, name: true, role: true, company: true },
          },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  if (search) {
    targets = targets.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        (t.targetRole && t.targetRole.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ targets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, targetRole, priority, jobLink, status, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const target = await prisma.targetCompany.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        targetRole: targetRole?.trim() || null,
        priority: priority || "Medium",
        jobLink: jobLink?.trim() || null,
        status: status || "Needs referral",
        notes: notes?.trim() || null,
        checklist: body.checklist || DEFAULT_CHECKLIST,
      },
    });

    return NextResponse.json({ target }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
