import Link from "next/link";
import { connection } from "next/server";
import { isEmailDeliveryAvailable } from "@/lib/auth-tokens";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  // Render per request so a newly configured mailer takes effect without a rebuild.
  await connection();

  // Don't accept a request and promise an email we can't send.
  if (!isEmailDeliveryAvailable()) {
    return (
      <AuthShell title="Reset your password">
        <AuthNotice tone="error">
          Password reset by email is temporarily unavailable. Please continue with Google.
        </AuthNotice>
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return <ForgotPasswordForm />;
}
