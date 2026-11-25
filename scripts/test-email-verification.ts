/**
 * End-to-end checks for email verification and password reset.
 * Run against a dev server (`npm run dev`) with the same DATABASE_URL:
 *   npx tsx scripts/test-email-verification.ts
 *
 * Emails aren't readable here, so the script plants tokens with known raw
 * values directly in VerificationToken (hashed exactly like the app does).
 */
import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://abubeker@localhost:5432/applytrack",
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BASE_URL = "http://localhost:3000";
// Must match src/lib/auth-tokens.ts.
const RESET_PREFIX = "password-reset:";
// A fresh fake client IP per run so the reset endpoint's per-IP limit
// doesn't trip when the suite is run several times against one dev server.
const TEST_IP = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

/** Insert a token with a known raw value; returns the raw value. */
async function plantToken(identifier: string, expiresInMs: number) {
  const raw = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier, token: hash(raw), expires: new Date(Date.now() + expiresInMs) },
  });
  return raw;
}

const cookiesOf = (res: Response) =>
  res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

/** Credentials sign-in; returns the session cookie (if any) and redirect target. */
async function login(email: string, password: string) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: cookiesOf(csrfRes),
    },
    body: new URLSearchParams({ csrfToken, email, password }).toString(),
    redirect: "manual",
  });
  const cookie = cookiesOf(res);
  return {
    session: cookie.includes("authjs.session-token") ? cookie : null,
    location: res.headers.get("location") ?? "",
  };
}

async function sessionUser(cookie: string) {
  const res = await fetch(`${BASE_URL}/api/auth/session`, { headers: { cookie } });
  const data = await res.json().catch(() => null);
  return data?.user?.email ?? null;
}

const verifyPage = async (token: string, email: string) =>
  (await fetch(`${BASE_URL}/verify?token=${token}&email=${encodeURIComponent(email)}`)).text();

const postJson = (path: string, body: unknown) =>
  fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": TEST_IP },
    body: JSON.stringify(body),
  });

async function register(email: string, password: string) {
  return postJson("/api/auth/register", { name: "Verify Tester", email, password });
}

async function run() {
  console.log("=== EMAIL VERIFICATION & PASSWORD RESET ===\n");
  const stamp = Date.now();
  const alice = `verify.alice.${stamp}@applytrack.test`;
  const bob = `verify.bob.${stamp}@applytrack.test`;
  const password = "Password123!";
  const newPassword = "NewPassword456!";

  try {
    // --- Sign-up ---
    const reg = await register(alice, password);
    const regData = await reg.json();
    assert(reg.status === 201 && regData.success, "Sign-up: account created");
    if (reg.status === 503) {
      throw new Error("Email delivery is unavailable on the server under test (see APP_URL / mailer)");
    }
    await register(bob, password);

    const aliceRow = await prisma.user.findUniqueOrThrow({ where: { email: alice } });
    assert(aliceRow.emailVerified === null, "Sign-up: new account starts unverified");
    const issued = await prisma.verificationToken.findMany({ where: { identifier: alice } });
    assert(
      issued.length === 1 && /^[0-9a-f]{64}$/.test(issued[0].token),
      "Sign-up: one verification token stored, as a SHA-256 hash"
    );

    // --- Unverified sign-in ---
    const unverified = await login(alice, password);
    assert(!unverified.session, "Sign-in: unverified account gets no session");
    assert(
      unverified.location.includes("code=email_not_verified"),
      "Sign-in: unverified account is told to verify",
      unverified.location
    );
    const wrongPw = await login(alice, "WrongPassword!");
    assert(
      !wrongPw.location.includes("email_not_verified"),
      "Sign-in: wrong password doesn't reveal verification status"
    );

    // --- Expired link ---
    const expired = await plantToken(bob, -60_000);
    const expiredHtml = await verifyPage(expired, bob);
    assert(expiredHtml.includes("Link expired"), "Verify: expired link shows 'Link expired'");
    const bobAfterExpired = await prisma.user.findUniqueOrThrow({ where: { email: bob } });
    assert(bobAfterExpired.emailVerified === null, "Verify: expired link doesn't verify");

    // --- Token separation: a reset token can't verify an email ---
    const resetForBob = await plantToken(RESET_PREFIX + bob, 60 * 60 * 1000);
    const crossHtml = await verifyPage(resetForBob, bob);
    assert(crossHtml.includes("Invalid link"), "Separation: reset token rejected by /verify");
    const bobAfterCross = await prisma.user.findUniqueOrThrow({ where: { email: bob } });
    assert(bobAfterCross.emailVerified === null, "Separation: reset token didn't verify the email");

    // --- Valid link, then reuse ---
    await prisma.verificationToken.deleteMany({ where: { identifier: alice } });
    const good = await plantToken(alice, 24 * 60 * 60 * 1000);
    const okHtml = await verifyPage(good, alice);
    assert(okHtml.includes("Your email is verified"), "Verify: valid link verifies");
    const aliceVerified = await prisma.user.findUniqueOrThrow({ where: { email: alice } });
    assert(aliceVerified.emailVerified !== null, "Verify: emailVerified is set");

    const againHtml = await verifyPage(good, alice);
    assert(againHtml.includes("already verified"), "Verify: reused link shows 'already verified'");

    const probeHtml = await verifyPage(randomBytes(32).toString("hex"), alice);
    assert(
      probeHtml.includes("Invalid link") && !probeHtml.includes("already verified"),
      "Verify: made-up token doesn't reveal that the email is verified"
    );

    // --- Verified sign-in ---
    const before = await login(alice, password);
    assert(!!before.session, "Sign-in: verified account gets a session");
    const oldSession = before.session ?? "";
    assert((await sessionUser(oldSession)) === alice, "Session: session is valid before reset");

    // --- Token separation: a verification token can't reset a password ---
    const verifyForBob = await plantToken(bob, 24 * 60 * 60 * 1000);
    const crossReset = await postJson("/api/auth/reset-password", {
      email: bob,
      token: verifyForBob,
      password: newPassword,
    });
    assert(crossReset.status === 400, "Separation: verification token rejected by reset");

    // --- Password reset ---
    const bogusReset = await postJson("/api/auth/reset-password", {
      email: alice,
      token: randomBytes(32).toString("hex"),
      password: newPassword,
    });
    assert(bogusReset.status === 400, "Reset: made-up token rejected");

    const resetToken = await plantToken(RESET_PREFIX + alice, 60 * 60 * 1000);
    const reset = await postJson("/api/auth/reset-password", {
      email: alice,
      token: resetToken,
      password: newPassword,
    });
    assert(reset.status === 200, "Reset: valid link sets a new password");

    const reused = await postJson("/api/auth/reset-password", {
      email: alice,
      token: resetToken,
      password: "AnotherPassword789!",
    });
    assert(reused.status === 400, "Reset: link is single-use");

    assert((await sessionUser(oldSession)) === null, "Reset: existing sessions are signed out");
    assert(!(await login(alice, password)).session, "Reset: old password no longer works");
    assert(!!(await login(alice, newPassword)).session, "Reset: new password works");

    // --- Endpoints that must not reveal which emails exist ---
    const unknown = `nobody.${stamp}@applytrack.test`;
    const resendUnknown = await postJson("/api/auth/resend-verification", { email: unknown });
    const resendKnown = await postJson("/api/auth/resend-verification", { email: alice });
    assert(
      resendUnknown.status === 200 && resendKnown.status === 200,
      "Resend: same success response for unknown and known emails"
    );
    const forgotUnknown = await postJson("/api/auth/forgot-password", { email: unknown });
    assert(forgotUnknown.status === 200, "Forgot: success response for unknown email");
  } catch (err) {
    assert(false, "Email verification suite", String(err));
  } finally {
    const emails = [alice, bob];
    await prisma.verificationToken.deleteMany({
      where: {
        OR: emails.flatMap((e) => [
          { identifier: e },
          { identifier: RESET_PREFIX + e },
          { identifier: `email-verified:${e}` },
        ]),
      },
    });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run();
