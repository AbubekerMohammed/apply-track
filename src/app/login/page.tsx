import { connection } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import LoginForm from "./login-form";

export default async function LoginPage() {
  // Read env at request time rather than freezing it at build.
  await connection();

  return (
    <LoginForm
      demoMode={isDemoMode()}
      googleEnabled={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
      microsoftEnabled={
        !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET)
      }
    />
  );
}
