import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateCSV } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: { referrerContact: true },
    orderBy: { dateApplied: "desc" },
  });

  const columns = [
    { key: "company", header: "Company" },
    { key: "role", header: "Role" },
    { key: "location", header: "Location" },
    { key: "jobLink", header: "Job Link" },
    { key: "stage", header: "Stage" },
    { key: "dateApplied", header: "Date Applied" },
    { key: "source", header: "Source" },
    { key: "referred", header: "Referred" },
    { key: "referrerName", header: "Referrer Name" },
    { key: "salaryRange", header: "Salary Range" },
    { key: "notes", header: "Notes" },
  ];

  const exportData = applications.map((app) => ({
    company: app.company,
    role: app.role,
    location: app.location || "",
    jobLink: app.jobLink || "",
    stage: app.stage,
    dateApplied: app.dateApplied,
    source: app.source || "",
    referred: app.referred ? "Yes" : "No",
    referrerName: app.referrerContact?.name || "",
    salaryRange: app.salaryRange || "",
    notes: app.notes || "",
  }));

  const csvContent = generateCSV(columns, exportData);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applytrack_applications_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
