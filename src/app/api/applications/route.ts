import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STAGES = [
  "Applied",
  "Assessment",
  "Recruiter Call",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted",
] as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const stage = searchParams.get("stage");
  const referred = searchParams.get("referred");
  const source = searchParams.get("source");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (stage && stage !== "all") {
    whereClause.stage = stage;
  }

  if (referred === "true") {
    whereClause.referred = true;
  } else if (referred === "false") {
    whereClause.referred = false;
  }

  if (source && source !== "all") {
    whereClause.source = source;
  }

  if (dateFrom || dateTo) {
    whereClause.dateApplied = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  if (search) {
    whereClause.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      referrerContact: {
        select: { id: true, name: true, company: true, email: true },
      },
      stageHistory: {
        orderBy: { changedAt: "desc" },
      },
      emailEvents: {
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      company,
      role,
      location,
      jobLink,
      dateApplied,
      source = "LinkedIn",
      referred = false,
      referrerContactId,
      stage = "Applied",
      salaryRange,
      notes,
    } = body;

    if (!company?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: "Company and Role are required." },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        company: company.trim(),
        role: role.trim(),
        location: location?.trim() || null,
        jobLink: jobLink?.trim() || null,
        dateApplied: dateApplied ? new Date(dateApplied) : new Date(),
        source: source || "LinkedIn",
        referred: Boolean(referred),
        referrerContactId: referrerContactId || null,
        stage: stage || "Applied",
        salaryRange: salaryRange?.trim() || null,
        notes: notes?.trim() || null,
        stageHistory: {
          create: {
            fromStage: null,
            toStage: stage || "Applied",
            notes: "Application created",
          },
        },
      },
      include: {
        referrerContact: true,
        stageHistory: true,
        emailEvents: true,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
