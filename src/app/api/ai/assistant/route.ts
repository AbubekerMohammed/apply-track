import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processAICareerQuery } from "@/lib/ai/assistant";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question query parameter is required" },
        { status: 400 }
      );
    }

    const response = await processAICareerQuery(session.user.id, question.trim());
    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
