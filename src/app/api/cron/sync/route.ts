import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAIL_PROVIDERS } from "@/lib/email/oauth";
import { syncUserInboxes } from "@/lib/email/sync-user";
import { autoMarkGhostedApplications } from "@/lib/ghosted";

export const maxDuration = 300;

/**
 * Daily job (see vercel.json): syncs every connected inbox and marks
 * long-silent applications as Ghosted. Vercel Cron authenticates with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mailUsers = await prisma.account.findMany({
    where: { provider: { in: MAIL_PROVIDERS } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let synced = 0;
  let failed = 0;
  for (const { userId } of mailUsers) {
    try {
      const outcome = await syncUserInboxes(userId, 7);
      if (outcome.errors.length) failed++;
      else synced++;
    } catch (err) {
      failed++;
      console.error(`Cron sync failed for user ${userId}:`, err);
    }
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  let ghosted = 0;
  for (const { id } of users) {
    try {
      ghosted += (await autoMarkGhostedApplications(id)).markedCount;
    } catch (err) {
      console.error(`Auto-ghost failed for user ${id}:`, err);
    }
  }

  return NextResponse.json({ synced, failed, ghosted });
}
