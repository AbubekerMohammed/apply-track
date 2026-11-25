import { googleAuthEnabled, microsoftAuthEnabled } from "@/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <LoginForm
      google={googleAuthEnabled}
      microsoft={microsoftAuthEnabled}
      callbackUrl={safeCallbackUrl(params.callbackUrl)}
      initialError={error}
      registered={params.registered === "true"}
    />
  );
}
