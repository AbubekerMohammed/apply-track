import { prisma } from "@/lib/prisma";

export interface AutoGhostResult {
  markedCount: number;
  applications: Array<{
    id: string;
    company: string;
    role: string;
    dateApplied: Date;
    previousStage: string;
  }>;
}

/**
 * Scans a user's applications and auto-marks applications as "Ghosted"
 * if they have been in "Applied" or "Assessment" stage for 30+ days without response.
 */
export async function autoMarkGhostedApplications(userId: string): Promise<AutoGhostResult> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Eligible stages for ghosting: Applied, Assessment, Recruiter Call (not Offer, Rejected, or already Ghosted)
  const candidateApps = await prisma.application.findMany({
    where: {
      userId,
      stage: {
        in: ["Applied", "Assessment", "Recruiter Call"],
      },
      dateApplied: {
        lte: thirtyDaysAgo,
      },
    },
    select: {
      id: true,
      company: true,
      role: true,
      stage: true,
      dateApplied: true,
    },
  });

  if (candidateApps.length === 0) {
    return { markedCount: 0, applications: [] };
  }

  const affectedApps: AutoGhostResult["applications"] = [];

  for (const app of candidateApps) {
    await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: { stage: "Ghosted" },
      }),
      prisma.stageHistory.create({
        data: {
          applicationId: app.id,
          fromStage: app.stage,
          toStage: "Ghosted",
          notes: `Auto-marked as Ghosted: No response after 30 days (Applied on ${app.dateApplied.toISOString().split("T")[0]})`,
        },
      }),
    ]);

    affectedApps.push({
      id: app.id,
      company: app.company,
      role: app.role,
      dateApplied: app.dateApplied,
      previousStage: app.stage,
    });
  }

  return {
    markedCount: affectedApps.length,
    applications: affectedApps,
  };
}
