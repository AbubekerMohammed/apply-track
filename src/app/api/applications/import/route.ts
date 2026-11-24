import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let csvText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const json = await req.json();
      csvText = json.csv || "";
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV data" }, { status: 400 });
    }

    const records = parseCSV(csvText);

    if (records.length === 0) {
      return NextResponse.json({ error: "No records found in CSV file" }, { status: 400 });
    }

    const validStages = [
      "Applied",
      "Assessment",
      "Recruiter Call",
      "Interviewing",
      "Offer",
      "Rejected",
      "Ghosted",
    ];

    let importedCount = 0;

    for (const record of records) {
      // Find company & role keys by matching normalized header names
      const company =
        record["company"] || record["organization"] || record["employer"];
      const role =
        record["role"] || record["title"] || record["jobtitle"] || record["position"];

      if (!company || !role) continue;

      let stage = record["stage"] || record["status"] || "Applied";
      const matchedStage = validStages.find(
        (s) => s.toLowerCase() === stage.toLowerCase().trim()
      );
      stage = matchedStage || "Applied";

      let dateApplied = new Date();
      const dateVal = record["dateapplied"] || record["date"] || record["appliedat"];
      if (dateVal && !isNaN(Date.parse(dateVal))) {
        dateApplied = new Date(dateVal);
      }

      const referredVal = (record["referred"] || record["referral"] || "").toLowerCase();
      const referred =
        referredVal === "yes" ||
        referredVal === "y" ||
        referredVal === "true" ||
        referredVal === "1";

      await prisma.application.create({
        data: {
          userId: session.user.id,
          company: company.trim(),
          role: role.trim(),
          location: record["location"]?.trim() || null,
          jobLink: record["joblink"] || record["url"] || record["link"] || null,
          stage,
          dateApplied,
          source: record["source"]?.trim() || "CSV Import",
          referred,
          salaryRange: record["salaryrange"] || record["salary"] || null,
          notes: record["notes"]?.trim() || null,
          stageHistory: {
            create: {
              fromStage: null,
              toStage: stage,
              notes: "Imported from CSV",
            },
          },
        },
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      totalRows: records.length,
    });
  } catch (error: unknown) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to parse and import CSV" }, { status: 500 });
  }
}
