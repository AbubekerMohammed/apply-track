import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();

  if (provider === "gmail") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { gmailConnected: true },
    });
    return NextResponse.json({ success: true, provider: "gmail", connected: true });
  } else if (provider === "outlook") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { outlookConnected: true },
    });
    return NextResponse.json({ success: true, provider: "outlook", connected: true });
  }

  return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
}
