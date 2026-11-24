import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      gmailConnected: true,
      outlookConnected: true,
      updatedAt: true,
    },
  });

  const [needsReviewCount, totalSyncedCount] = await Promise.all([
    prisma.emailEvent.count({
      where: { userId: session.user.id, needsReview: true },
    }),
    prisma.emailEvent.count({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    gmailConnected: Boolean(user?.gmailConnected),
    outlookConnected: Boolean(user?.outlookConnected),
    needsReviewCount,
    totalSyncedCount,
  });
}
