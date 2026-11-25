import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { appOrigin, normalizeEmail, sendVerificationEmail } from "@/lib/auth-tokens";

/**
 * Re-send the verification link for an unverified email/password account.
 * Always answers the same way so it can't be used to discover which emails
 * have accounts; the lookup and send run after the response is sent.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);

  if (email && email.length <= 254) {
    after(async () => {
      try {
        // Throws in production without APP_URL; caught so the reply never changes.
        const origin = appOrigin(req);
        const user = await prisma.user.findUnique({
          where: { email },
          select: { emailVerified: true, password: true },
        });
        if (user?.password && user.emailVerified === null) {
          await sendVerificationEmail(email, origin);
        }
      } catch (error) {
        console.error("Failed to resend verification email:", error);
      }
    });
  }

  return NextResponse.json({ success: true });
}
