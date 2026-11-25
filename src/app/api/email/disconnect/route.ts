import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { disconnectMailAccount, isMailProvider } from "@/lib/email/oauth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json().catch(() => ({}));
  if (typeof provider !== "string" || !isMailProvider(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await disconnectMailAccount(session.user.id, provider);
  return NextResponse.json({ success: true, provider, connected: false });
}
