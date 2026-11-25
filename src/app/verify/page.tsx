import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  USED_VERIFY_IDENTIFIER_PREFIX,
  hashToken,
  isEmailDeliveryAvailable,
  normalizeEmail,
} from "@/lib/auth-tokens";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

type Result = "verified" | "already-verified" | "expired" | "invalid";

async function verify(token: string, email: string): Promise<Result> {
  if (!token || !email) return "invalid";

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!record) return "invalid";

  // This exact link was already used for this email (e.g. clicked twice, or
  // opened first by a mail scanner). Answering from the token itself, never
  // from the account, means a made-up token reveals nothing about the email.
  if (record.identifier === USED_VERIFY_IDENTIFIER_PREFIX + email) return "already-verified";
  if (record.identifier !== email) return "invalid";

  const now = new Date();
  if (record.expires <= now) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return "expired";
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return "invalid";

  return prisma.$transaction(async (tx): Promise<Result> => {
    // Claim the token by marking it used, but only if it is still this email's
    // live token. A concurrent resend (which replaces it) or another open of
    // the same link may have changed it since the read above; then nothing is
    // claimed and the email is not verified by this request. The used token is
    // kept (until its original expiry) so reopening the link shows "already
    // verified" rather than "invalid".
    const claimed = await tx.verificationToken.updateMany({
      where: { token: record.token, identifier: email, expires: { gt: now } },
      data: { identifier: USED_VERIFY_IDENTIFIER_PREFIX + email },
    });
    if (claimed.count !== 1) {
      const current = await tx.verificationToken.findUnique({
        where: { token: record.token },
        select: { identifier: true },
      });
      return current?.identifier === USED_VERIFY_IDENTIFIER_PREFIX + email
        ? "already-verified"
        : "invalid";
    }

    await tx.user.update({ where: { id: user.id }, data: { emailVerified: now } });
    // Housekeeping: drop used tokens that have passed their expiry.
    await tx.verificationToken.deleteMany({
      where: { identifier: { startsWith: USED_VERIFY_IDENTIFIER_PREFIX }, expires: { lte: now } },
    });
    return "verified";
  });
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const token = first(params.token);
  const email = normalizeEmail(first(params.email));

  const result = await verify(token, email);

  if (result === "verified" || result === "already-verified") {
    return (
      <AuthShell title="Email verified">
        <AuthNotice tone="success">
          {result === "verified"
            ? "Your email is verified. You can now sign in."
            : "Your email is already verified. You can sign in."}
        </AuthNotice>
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={result === "expired" ? "Link expired" : "Invalid link"}>
      <AuthNotice tone="error">
        {result === "expired"
          ? "This verification link has expired. Verification links are valid for 24 hours."
          : "This verification link is invalid or has already been used."}
      </AuthNotice>
      {email && isEmailDeliveryAvailable() && <ResendVerificationButton email={email} />}
      <Link href="/login" className={authLinkClass}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}
