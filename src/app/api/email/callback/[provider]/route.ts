import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { auth } from "@/auth";
import {
  appBaseUrl,
  exchangeCode,
  fetchMailboxAddress,
  isMailProvider,
  saveMailAccount,
} from "@/lib/email/oauth";
import { syncUserInboxes } from "@/lib/email/sync-user";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const base = appBaseUrl(req);
  const fail = (code: string) => {
    const res = NextResponse.redirect(`${base}/settings?mailError=${code}&provider=${provider}`);
    res.cookies.delete({ name: `mail_oauth_${provider}`, path: `/api/email/callback/${provider}` });
    return res;
  };

  if (!isMailProvider(provider)) return fail("invalid_provider");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${base}/login?callbackUrl=/settings`);
  }

  const url = req.nextUrl;
  if (url.searchParams.get("error")) return fail("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = req.cookies.get(`mail_oauth_${provider}`)?.value;
  if (!code || !state || !cookie) return fail("invalid_state");

  const [expectedState, cookieUserId] = cookie.split(".");
  if (!safeEqual(state, expectedState) || cookieUserId !== session.user.id) {
    return fail("invalid_state");
  }

  try {
    const tokens = await exchangeCode(req, provider, code);
    const mailbox = await fetchMailboxAddress(provider, tokens.access_token);
    await saveMailAccount(session.user.id, provider, mailbox, tokens);
  } catch (err) {
    console.error(`Mail connect failed for ${provider}:`, err);
    return fail("connect_failed");
  }

  // Kick off the first import right away so the user sees results immediately.
  try {
    await syncUserInboxes(session.user.id);
  } catch (err) {
    console.error("Initial inbox sync failed:", err);
  }

  const res = NextResponse.redirect(`${base}/settings?mailConnected=${provider}`);
  res.cookies.delete({ name: `mail_oauth_${provider}`, path: `/api/email/callback/${provider}` });
  return res;
}
