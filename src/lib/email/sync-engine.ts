import { prisma } from "@/lib/prisma";
import { NormalizedEmailMessage } from "./email-provider";
import { classifyEmail } from "./classifier";

export interface SyncResult {
  totalProcessed: number;
  newApplicationsCreated: number;
  stagesUpdated: number;
  needsReviewCount: number;
  duplicatesSkipped: number;
  unrelatedSkipped: number;
}

export async function processAndSyncEmails(
  userId: string,
  messages: NormalizedEmailMessage[]
): Promise<SyncResult> {
  let newApplicationsCreated = 0;
  let stagesUpdated = 0;
  let needsReviewCount = 0;
  let duplicatesSkipped = 0;
  let totalProcessed = 0;
  let unrelatedSkipped = 0;

  for (const message of messages) {
    // 1. De-duplication check by messageId
    const existingEvent = await prisma.emailEvent.findFirst({
      where: {
        userId,
        provider: message.provider,
        messageId: message.messageId,
      },
    });

    if (existingEvent) {
      duplicatesSkipped++;
      continue;
    }

    // 2. Cross-provider de-duplication check:
    // If same subject and sender received within 24 hours from other provider
    const crossProviderDuplicate = await prisma.emailEvent.findFirst({
      where: {
        userId,
        subject: message.subject,
        sender: message.sender,
      },
    });

    if (crossProviderDuplicate) {
      duplicatesSkipped++;
      continue;
    }

    // 3. Classify message
    const extracted = await classifyEmail(message);

    // Mail that isn't about a job application is ignored entirely and never stored.
    if (extracted.classification === "other") {
      unrelatedSkipped++;
      continue;
    }
    totalProcessed++;

    // 4. Try to find an existing matching application
    let matchingApp = null;
    if (extracted.company && extracted.company !== "Unknown Company") {
      const userApps = await prisma.application.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      matchingApp = userApps.find((app) => {
        const appComp = app.company.toLowerCase().trim();
        const extComp = extracted.company.toLowerCase().trim();
        return (
          appComp.includes(extComp) ||
          extComp.includes(appComp) ||
          (appComp.split(" ")[0].length > 2 &&
            appComp.split(" ")[0] === extComp.split(" ")[0])
        );
      }) || null;
    }

    let linkedApplicationId: string | null = matchingApp?.id || null;

    // 5. High-confidence actions
    if (!extracted.needsReview) {
      if (extracted.classification === "application_confirmation") {
        if (!matchingApp) {
          // Auto-create new application
          const newApp = await prisma.application.create({
            data: {
              userId,
              company: extracted.company,
              role: extracted.role,
              stage: "Applied",
              source: `${message.provider.toUpperCase()} Email Detection`,
              dateApplied: extracted.date,
              stageHistory: {
                create: {
                  fromStage: null,
                  toStage: "Applied",
                  notes: `Auto-created from ${message.provider.toUpperCase()} confirmation email`,
                },
              },
            },
          });
          matchingApp = newApp;
          linkedApplicationId = newApp.id;
          newApplicationsCreated++;
        }
      } else if (matchingApp) {
        // Map classification to stage update
        let newStage: string | null = null;
        let updateNote = "";

        switch (extracted.classification) {
          case "assessment_invite":
            newStage = "Assessment";
            updateNote = `Assessment invite detected (${extracted.platform || "OA"})`;
            break;
          case "recruiter_outreach":
            newStage = "Recruiter Call";
            updateNote = "Recruiter outreach detected";
            break;
          case "interview_invite":
            newStage = "Interviewing";
            updateNote = "Interview invitation received";
            break;
          case "offer":
            newStage = "Offer";
            updateNote = "Job offer detected";
            break;
          case "rejection":
            newStage = "Rejected";
            updateNote = "Rejection email received";
            break;
        }

        if (newStage && matchingApp.stage !== newStage) {
          await prisma.application.update({
            where: { id: matchingApp.id },
            data: {
              stage: newStage,
              stageHistory: {
                create: {
                  fromStage: matchingApp.stage,
                  toStage: newStage,
                  notes: updateNote,
                },
              },
            },
          });
          stagesUpdated++;
        }
      }
    } else {
      needsReviewCount++;
    }

    // 6. Record EmailEvent (NEVER store full body, only snippet and extracted data!)
    await prisma.emailEvent.create({
      data: {
        userId,
        applicationId: linkedApplicationId,
        provider: message.provider,
        messageId: message.messageId,
        threadId: message.threadId || null,
        date: message.date,
        sender: message.sender,
        subject: message.subject,
        snippet: message.snippet.slice(0, 300), // Max snippet 300 chars
        classification: extracted.classification,
        confidence: extracted.confidence,
        extractedData: {
          company: extracted.company,
          role: extracted.role,
          platform: extracted.platform,
        },
        needsReview: extracted.needsReview,
        isProcessed: true,
      },
    });
  }

  return {
    totalProcessed,
    newApplicationsCreated,
    stagesUpdated,
    needsReviewCount,
    duplicatesSkipped,
    unrelatedSkipped,
  };
}
