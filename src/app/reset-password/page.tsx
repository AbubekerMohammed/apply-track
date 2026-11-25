import Link from "next/link";
import { normalizeEmail } from "@/lib/auth-tokens";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const token = first(params.token);
  const email = normalizeEmail(first(params.email));

  // The token is only checked (and consumed) when the form is submitted, so
  // link scanners that open the URL can't use it up.
  if (!token || !email) {
    return (
      <AuthShell title="Invalid link">
        <AuthNotice tone="error">This reset link is incomplete. Please request a new one.</AuthNotice>
        <Link href="/forgot-password" className={authLinkClass}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <ResetPasswordForm token={token} email={email} />
    </AuthShell>
  );
}
