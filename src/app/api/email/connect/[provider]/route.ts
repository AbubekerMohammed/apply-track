import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { appBaseUrl, buildAuthorizeUrl, isMailProvider, isProviderConfigured } from "@/lib/email/oauth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const base = appBaseUrl(req);
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(`${base}/login?callbackUrl=/settings`);
  }
  if (!isMailProvider(provider)) {
    return NextResponse.redirect(`${base}/settings?mailError=invalid_provider`);
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(`${base}/settings?mailError=not_configured&provider=${provider}`);
  }

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(buildAuthorizeUrl(req, provider, state));
  res.cookies.set(`mail_oauth_${provider}`, `${state}.${session.user.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/api/email/callback/${provider}`,
    maxAge: 600,
  });
  return res;
}
