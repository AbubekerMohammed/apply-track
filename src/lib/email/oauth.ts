import { prisma } from "@/lib/prisma";

export type MailProvider = "gmail" | "outlook";

export const MAIL_PROVIDERS: MailProvider[] = ["gmail", "outlook"];

export function isMailProvider(value: string): value is MailProvider {
  return (MAIL_PROVIDERS as string[]).includes(value);
}

interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  extraAuthorizeParams: Record<string, string>;
}

function tenant() {
  return process.env.AZURE_AD_TENANT_ID || "common";
}

function getConfig(provider: MailProvider): ProviderConfig {
  if (provider === "gmail") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly"],
      // offline + consent guarantees a refresh token on every connect.
      extraAuthorizeParams: { access_type: "offline", prompt: "consent" },
    };
  }
  return {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    authorizeUrl: `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`,
    scopes: ["offline_access", "User.Read", "Mail.Read"],
    extraAuthorizeParams: { prompt: "select_account" },
  };
}

export function isProviderConfigured(provider: MailProvider): boolean {
  const cfg = getConfig(provider);
  return Boolean(cfg.clientId && cfg.clientSecret);
}

/** Public base URL of the app, used to build OAuth redirect URIs. */
export function appBaseUrl(req: Request): string {
  const configured = process.env.APP_URL || process.env.AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export function redirectUri(req: Request, provider: MailProvider): string {
  return `${appBaseUrl(req)}/api/email/callback/${provider}`;
}

export function buildAuthorizeUrl(req: Request, provider: MailProvider, state: string): string {
  const cfg = getConfig(provider);
  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("client_id", cfg.clientId!);
  url.searchParams.set("redirect_uri", redirectUri(req, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(cfg.extraAuthorizeParams)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

async function requestToken(
  provider: MailProvider,
  params: Record<string, string>
): Promise<TokenResponse> {
  const cfg = getConfig(provider);
  const body = new URLSearchParams({
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
    ...params,
  });
  if (provider === "outlook") body.set("scope", cfg.scopes.join(" "));

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const reason = data.error_description || data.error || res.statusText;
    throw new MailAuthError(`Token request failed for ${provider}: ${reason}`);
  }
  return data as TokenResponse;
}

export class MailAuthError extends Error {}

export async function exchangeCode(
  req: Request,
  provider: MailProvider,
  code: string
): Promise<TokenResponse> {
  return requestToken(provider, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(req, provider),
  });
}

/** Looks up the mailbox address the token belongs to. */
export async function fetchMailboxAddress(
  provider: MailProvider,
  accessToken: string
): Promise<string> {
  const url =
    provider === "gmail"
      ? "https://gmail.googleapis.com/gmail/v1/users/me/profile"
      : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new MailAuthError(`Could not read ${provider} profile (${res.status})`);
  const data = await res.json();
  const address = provider === "gmail" ? data.emailAddress : data.mail || data.userPrincipalName;
  if (!address) throw new MailAuthError(`No mailbox address returned by ${provider}`);
  return String(address).toLowerCase();
}

export async function saveMailAccount(
  userId: string,
  provider: MailProvider,
  mailbox: string,
  tokens: TokenResponse
) {
  const expiresAt = tokens.expires_in
    ? Math.floor(Date.now() / 1000) + tokens.expires_in
    : null;

  // One mailbox per provider per user: replace any previous connection.
  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId, provider } }),
    prisma.account.deleteMany({ where: { provider, providerAccountId: mailbox } }),
    prisma.account.create({
      data: {
        userId,
        type: "oauth",
        provider,
        providerAccountId: mailbox,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        token_type: tokens.token_type ?? "Bearer",
        scope: tokens.scope ?? null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: provider === "gmail" ? { gmailConnected: true } : { outlookConnected: true },
    }),
  ]);
}

export async function getMailAccount(userId: string, provider: MailProvider) {
  return prisma.account.findFirst({ where: { userId, provider } });
}

/** Returns a valid access token, refreshing it when it is about to expire. */
export async function getValidAccessToken(userId: string, provider: MailProvider) {
  const account = await getMailAccount(userId, provider);
  if (!account?.access_token) {
    throw new MailAuthError(`${provider} is not connected`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now + 60) {
    return { accessToken: account.access_token, mailbox: account.providerAccountId };
  }

  if (!account.refresh_token) {
    throw new MailAuthError(`${provider} session expired. Please reconnect.`);
  }

  const tokens = await requestToken(provider, {
    grant_type: "refresh_token",
    refresh_token: account.refresh_token,
  });

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      // Microsoft rotates refresh tokens; Google usually omits a new one.
      refresh_token: tokens.refresh_token ?? account.refresh_token,
      expires_at: tokens.expires_in ? now + tokens.expires_in : null,
    },
  });

  return { accessToken: tokens.access_token, mailbox: account.providerAccountId };
}

export async function disconnectMailAccount(userId: string, provider: MailProvider) {
  const account = await getMailAccount(userId, provider);

  if (provider === "gmail" && account?.refresh_token) {
    // Best effort: revoke the grant at Google so the app loses access.
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: account.refresh_token }),
    }).catch(() => undefined);
  }

  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId, provider } }),
    prisma.user.update({
      where: { id: userId },
      data: provider === "gmail" ? { gmailConnected: false } : { outlookConnected: false },
    }),
  ]);
}
