import { connection } from "next/server";
import { googleAuthEnabled, microsoftAuthEnabled } from "@/auth";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  // Render per request so newly configured sign-in providers show up without a rebuild.
  await connection();
  return <RegisterForm google={googleAuthEnabled} microsoft={microsoftAuthEnabled} />;
}
