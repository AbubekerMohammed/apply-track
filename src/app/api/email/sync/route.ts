import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserInboxes } from "@/lib/email/sync-user";

// A first 90-day sync can fetch several hundred messages.
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcome = await syncUserInboxes(session.user.id);

  if (outcome.syncedProviders.length === 0 && outcome.errors.length === 0) {
    return NextResponse.json(
      { error: "No inbox connected. Connect Gmail or Outlook first." },
      { status: 400 }
    );
  }

  if (outcome.syncedProviders.length === 0) {
    return NextResponse.json(
      { error: outcome.errors.map((e) => e.message).join(" "), errors: outcome.errors },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, ...outcome });
}
