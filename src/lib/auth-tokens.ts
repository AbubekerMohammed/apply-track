import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { isMailerConfigured, sendEmail } from "@/lib/email/mailer";

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

/** Password-reset tokens share the VerificationToken table; this prefix keeps them apart. */
export const RESET_IDENTIFIER_PREFIX = "password-reset:";

const isDevelopment = process.env.NODE_ENV === "development";

/** Email sign-up needs a working mailer, except in development where links go to the console. */
export function isEmailSignupAvailable(): boolean {
  return isMailerConfigured() || isDevelopment;
}

export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.toLowerCase().trim() : "";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Base URL for links in emails: APP_URL if set, else the origin of the incoming request. */
export function appOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  return (configured || new URL(req.url).origin).replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function deliver(opts: { to: string; subject: string; intro: string; cta: string; link: string; outro: string }) {
  if (!isMailerConfigured()) {
    if (isDevelopment) {
      console.log(`[dev mailer] To: ${opts.to}\n  Subject: ${opts.subject}\n  Link: ${opts.link}`);
      return;
    }
    throw new Error("Email delivery is not configured");
  }
  const link = escapeHtml(opts.link);
  await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: `<p>${escapeHtml(opts.intro)}</p>
<p><a href="${link}">${escapeHtml(opts.cta)}</a></p>
<p>Or paste this link into your browser:<br>${link}</p>
<p style="color:#64748b;font-size:12px">${escapeHtml(opts.outro)}</p>`,
  });
}

/**
 * Replace any existing token for `identifier` with a new one and return the raw
 * token, or null if a token was issued less than a minute ago (rate limit).
 * Only the SHA-256 hash is stored.
 */
async function rotateToken(identifier: string, ttlMs: number): Promise<string | null> {
  const now = Date.now();
  const recent = await prisma.verificationToken.findFirst({
    // A token's issue time is its expiry minus the TTL.
    where: { identifier, expires: { gt: new Date(now + ttlMs - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return null;

  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(now + ttlMs) },
    }),
  ]);
  return token;
}

/** Issue a verification token for `email` and email the link. Returns false if rate-limited. */
export async function sendVerificationEmail(email: string, origin: string): Promise<boolean> {
  const token = await rotateToken(email, VERIFY_TOKEN_TTL_MS);
  if (!token) return false;
  const link = `${origin}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  await deliver({
    to: email,
    subject: "Verify your ApplyTrack email",
    intro: "Confirm your email address to finish setting up your ApplyTrack account.",
    cta: "Verify email",
    link,
    outro: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
  });
  return true;
}

/** Issue a single-use password reset token for `email` and email the link. */
export async function sendPasswordResetEmail(email: string, origin: string): Promise<boolean> {
  const token = await rotateToken(RESET_IDENTIFIER_PREFIX + email, RESET_TOKEN_TTL_MS);
  if (!token) return false;
  const link = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await deliver({
    to: email,
    subject: "Reset your ApplyTrack password",
    intro: "We received a request to reset the password for your ApplyTrack account.",
    cta: "Choose a new password",
    link,
    outro: "This link expires in 1 hour and can be used once. If you didn't ask for this, you can ignore this email.",
  });
  return true;
}
