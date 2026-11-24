import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAIL_PROVIDERS } from "@/lib/email/oauth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [accounts, needsReviewCount, totalSyncedCount] = await Promise.all([
    prisma.account.findMany({
      where: { userId, provider: { in: MAIL_PROVIDERS } },
      select: { provider: true, providerAccountId: true },
    }),
    prisma.emailEvent.count({ where: { userId, needsReview: true } }),
    prisma.emailEvent.count({ where: { userId } }),
  ]);

  const gmail = accounts.find((a) => a.provider === "gmail");
  const outlook = accounts.find((a) => a.provider === "outlook");

  return NextResponse.json({
    gmailConnected: Boolean(gmail),
    gmailAddress: gmail?.providerAccountId ?? null,
    outlookConnected: Boolean(outlook),
    outlookAddress: outlook?.providerAccountId ?? null,
    needsReviewCount,
    totalSyncedCount,
  });
}
