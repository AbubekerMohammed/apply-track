import { connection } from "next/server";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  // Read env at request time rather than freezing it at build.
  await connection();

  return (
    <RegisterForm
      googleEnabled={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
    />
  );
}
