import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RESET_IDENTIFIER_PREFIX, hashToken, normalizeEmail } from "@/lib/auth-tokens";

const INVALID_LINK =
  "This reset link is invalid or has expired. Please request a new one.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < 8 || password.length > 200) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (!email || !token) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  }

  const identifier = RESET_IDENTIFIER_PREFIX + email;
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const ok = await prisma.$transaction(async (tx) => {
      // Consuming the token is the check: only one request can delete it.
      const consumed = await tx.verificationToken.deleteMany({
        where: { identifier, token: hashToken(token), expires: { gt: new Date() } },
      });
      if (consumed.count !== 1) return false;

      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
      });
      if (!user) return false;

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          // Opening the emailed link proves ownership of the address.
          emailVerified: user.emailVerified ?? new Date(),
          // Sign out every existing session.
          sessionVersion: { increment: 1 },
        },
      });
      // Any outstanding verification or reset links are no longer needed.
      await tx.verificationToken.deleteMany({
        where: { identifier: { in: [identifier, email] } },
      });
      return true;
    });

    if (!ok) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
