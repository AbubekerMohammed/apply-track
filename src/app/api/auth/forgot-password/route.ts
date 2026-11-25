import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { appOrigin, normalizeEmail, sendPasswordResetEmail } from "@/lib/auth-tokens";

/**
 * Email a password reset link if an account exists. Always answers the same
 * way; the lookup and send run after the response so timing doesn't leak
 * whether the account exists.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);

  if (email && email.length <= 254) {
    after(async () => {
      try {
        // Throws in production without APP_URL; caught so the reply never changes.
        const origin = appOrigin(req);
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (user) await sendPasswordResetEmail(email, origin);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    });
  }

  return NextResponse.json({ success: true });
}
