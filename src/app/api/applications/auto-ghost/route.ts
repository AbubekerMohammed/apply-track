import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { autoMarkGhostedApplications } from "@/lib/ghosted";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await autoMarkGhostedApplications(session.user.id);
    return NextResponse.json({
      success: true,
      markedCount: result.markedCount,
      applications: result.applications,
      message:
        result.markedCount > 0
          ? `Auto-marked ${result.markedCount} application(s) as Ghosted (30+ days with no response)`
          : "No applications reached the 30-day inactivity threshold",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
