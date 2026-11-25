import { prisma } from "@/lib/prisma";
import { fetchRecentMessages } from "./fetchers";
import { MailAuthError, MailProvider, MAIL_PROVIDERS } from "./oauth";
import { processAndSyncEmails, SyncResult } from "./sync-engine";

export interface UserSyncOutcome {
  result: SyncResult;
  errors: Array<{ provider: MailProvider; message: string; reconnect: boolean }>;
  syncedProviders: MailProvider[];
}

const EMPTY: SyncResult = {
  totalProcessed: 0,
  newApplicationsCreated: 0,
  stagesUpdated: 0,
  needsReviewCount: 0,
  duplicatesSkipped: 0,
  unrelatedSkipped: 0,
};

/** Pulls recent mail from every connected inbox for a user and classifies it. */
export async function syncUserInboxes(userId: string, daysBack = 90): Promise<UserSyncOutcome> {
  const accounts = await prisma.account.findMany({
    where: { userId, provider: { in: MAIL_PROVIDERS } },
    select: { provider: true },
  });

  const result: SyncResult = { ...EMPTY };
  const errors: UserSyncOutcome["errors"] = [];
  const syncedProviders: MailProvider[] = [];

  for (const { provider } of accounts) {
    const p = provider as MailProvider;
    try {
      const known = await prisma.emailEvent.findMany({
        where: { userId, provider: p, date: { gte: new Date(Date.now() - daysBack * 24 * 3600 * 1000) } },
        select: { messageId: true },
      });
      const messages = await fetchRecentMessages(
        userId,
        p,
        daysBack,
        new Set(known.map((e) => e.messageId))
      );
      const r = await processAndSyncEmails(userId, messages);
      for (const key of Object.keys(result) as Array<keyof SyncResult>) {
        result[key] += r[key];
      }
      syncedProviders.push(p);
    } catch (err) {
      const reconnect = err instanceof MailAuthError;
      console.error(`Inbox sync failed for ${p}:`, err);
      errors.push({
        provider: p,
        reconnect,
        message: reconnect
          ? `${p === "gmail" ? "Gmail" : "Outlook"} access expired. Please reconnect.`
          : `Could not sync ${p === "gmail" ? "Gmail" : "Outlook"} right now. Try again shortly.`,
      });
    }
  }

  return { result, errors, syncedProviders };
}
