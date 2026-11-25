import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth, googleAuthEnabled, microsoftAuthEnabled } from "@/auth";
import { isEmailSignupAvailable } from "@/lib/auth-tokens";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  // Render per request so newly configured sign-in providers show up without a rebuild.
  await connection();
  if (await auth()) redirect("/dashboard");
  return (
    <RegisterForm
      google={googleAuthEnabled}
      microsoft={microsoftAuthEnabled}
      emailSignupAvailable={isEmailSignupAvailable()}
    />
  );
}
