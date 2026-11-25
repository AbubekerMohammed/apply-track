import { prisma } from "@/lib/prisma";
import { NormalizedEmailMessage } from "./email-provider";
import { classifyEmail } from "./classifier";
import { nextStage, pickApplication } from "./matching";

export interface SyncResult {
  totalProcessed: number;
  newApplicationsCreated: number;
  stagesUpdated: number;
  needsReviewCount: number;
  duplicatesSkipped: number;
  unrelatedSkipped: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STAGE_NOTES: Record<string, string> = {
  Assessment: "Assessment invite detected",
  "Recruiter Call": "Recruiter outreach detected",
  Interviewing: "Interview invitation received",
  Offer: "Job offer detected",
  Rejected: "Rejection email received",
  Applied: "Application confirmation received",
};

export async function processAndSyncEmails(
  userId: string,
  messages: NormalizedEmailMessage[]
): Promise<SyncResult> {
  const result: SyncResult = {
    totalProcessed: 0,
    newApplicationsCreated: 0,
    stagesUpdated: 0,
    needsReviewCount: 0,
    duplicatesSkipped: 0,
    unrelatedSkipped: 0,
  };
  if (!messages.length) return result;

  // Oldest first, so a confirmation creates the application before the
  // rejection or interview invite that follows it is matched against it.
  const ordered = [...messages].sort((a, b) => a.date.getTime() - b.date.getTime());

  const seen = await prisma.emailEvent.findMany({
    where: {
      userId,
      OR: [
        { provider: "gmail", messageId: { in: ordered.filter((m) => m.provider === "gmail").map((m) => m.messageId) } },
        { provider: "outlook", messageId: { in: ordered.filter((m) => m.provider === "outlook").map((m) => m.messageId) } },
      ],
    },
    select: { provider: true, messageId: true },
  });
  const seenKeys = new Set(seen.map((e) => `${e.provider}:${e.messageId}`));

  // Loaded once and kept current as this sync creates and moves applications.
  const applications = await prisma.application.findMany({
    where: { userId },
    select: { id: true, company: true, role: true, stage: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  for (const message of ordered) {
    const key = `${message.provider}:${message.messageId}`;
    if (seenKeys.has(key)) {
      result.duplicatesSkipped++;
      continue;
    }
    seenKeys.add(key);

    // The same email delivered to both a Gmail and an Outlook inbox you've
    // connected: same subject and sender, arriving within a day.
    const crossProviderDuplicate = await prisma.emailEvent.findFirst({
      where: {
        userId,
        provider: { not: message.provider },
        subject: message.subject,
        sender: message.sender,
        date: {
          gte: new Date(message.date.getTime() - DAY_MS),
          lte: new Date(message.date.getTime() + DAY_MS),
        },
      },
      select: { id: true },
    });
    if (crossProviderDuplicate) {
      result.duplicatesSkipped++;
      continue;
    }

    const extracted = await classifyEmail(message);

    // Mail that isn't about a job application is ignored entirely and never stored.
    if (extracted.classification === "other") {
      result.unrelatedSkipped++;
      continue;
    }
    result.totalProcessed++;

    let needsReview = extracted.needsReview;
    let linkedApplicationId: string | null = null;

    if (!needsReview) {
      const pick = pickApplication(applications, extracted.company, extracted.role, extracted.classification);

      if (pick.kind === "match") {
        const app = pick.application;
        linkedApplicationId = app.id;
        const stage = nextStage(app.stage, extracted.classification);
        if (stage) {
          await prisma.application.update({
            where: { id: app.id },
            data: {
              stage,
              stageHistory: {
                create: {
                  fromStage: app.stage,
                  toStage: stage,
                  notes:
                    stage === "Assessment" && extracted.platform
                      ? `Assessment invite detected (${extracted.platform})`
                      : STAGE_NOTES[stage],
                },
              },
            },
          });
          app.stage = stage;
          result.stagesUpdated++;
        }
      } else if (pick.kind === "none" && extracted.classification === "application_confirmation") {
        const created = await prisma.application.create({
          data: {
            userId,
            company: extracted.company!,
            role: extracted.role!,
            stage: "Applied",
            source: extracted.platform
              ? `${extracted.platform} (via ${providerName(message.provider)})`
              : `${providerName(message.provider)} Email Detection`,
            dateApplied: extracted.date,
            stageHistory: {
              create: {
                fromStage: null,
                toStage: "Applied",
                notes: `Auto-created from ${providerName(message.provider)} confirmation email`,
              },
            },
          },
          select: { id: true, company: true, role: true, stage: true, updatedAt: true },
        });
        applications.unshift(created);
        linkedApplicationId = created.id;
        result.newApplicationsCreated++;
      } else {
        // An update for a company with no tracked application, or one that
        // fits several: let the user decide instead of guessing.
        needsReview = true;
      }
    }

    if (needsReview) result.needsReviewCount++;

    // Never store the full body: only the snippet and what was extracted.
    try {
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
          snippet: message.snippet.slice(0, 300),
          classification: extracted.classification,
          confidence: needsReview ? Math.min(extracted.confidence, 0.65) : extracted.confidence,
          extractedData: {
            company: extracted.company,
            role: extracted.role,
            platform: extracted.platform ?? null,
          },
          needsReview,
          isProcessed: true,
        },
      });
    } catch (err) {
      // A concurrent sync (cron plus "Sync Now") already stored this message.
      if ((err as { code?: string }).code !== "P2002") throw err;
      result.duplicatesSkipped++;
    }
  }

  return result;
}

function providerName(provider: NormalizedEmailMessage["provider"]) {
  return provider === "gmail" ? "Gmail" : "Outlook";
}
