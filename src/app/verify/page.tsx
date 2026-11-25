import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken, normalizeEmail } from "@/lib/auth-tokens";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

type Result = "verified" | "expired" | "invalid";

async function verify(token: string, email: string): Promise<Result> {
  if (!token || !email) return "invalid";

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!record || record.identifier !== email) return "invalid";

  if (record.expires <= new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return "expired";
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return "invalid";

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { token: record.token } }),
  ]);
  return "verified";
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

  if (result === "verified") {
    return (
      <AuthShell title="Email verified">
        <AuthNotice tone="success">Your email is verified. You can now sign in.</AuthNotice>
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
      {email && <ResendVerificationButton email={email} />}
      <Link href="/login" className={authLinkClass}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}
