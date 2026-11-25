import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://abubeker@localhost:5432/applytrack",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";

async function runPhase4And5Tests() {
  console.log("==================================================");
  console.log("   TRAILL PHASES 4 & 5 TEST & VERIFICATION    ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || "Condition not met"}`);
      failed++;
    }
  }

  try {
    // 1. Create a test user for Email tests
    const testEmail = `emailtest.${Date.now()}@example.test`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Email Tester",
        email: testEmail,
        password: "Password123!",
      }),
    });

    // Mark the email verified so the credentials sign-in below is allowed.
    const user = await prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: new Date() },
    });

    // Session login
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfCookies = csrfRes.headers.getSetCookie
      ? csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
      : "";

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        cookie: csrfCookies,
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: testEmail,
        password: "Password123!",
      }).toString(),
      redirect: "manual",
    });

    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
    const sessionCookie = setCookies.map((c) => c.split(";")[0]).join("; ");

    assert(sessionCookie.includes("authjs.session-token"), "Auth: Obtained authenticated session cookie");

    // 2. TEST: Gmail Connect & Disconnect
    const gConnectRes = await fetch(`${BASE_URL}/api/email/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ provider: "gmail" }),
    });
    const gConnectData = await gConnectRes.json();
    assert(gConnectRes.status === 200 && gConnectData.connected === true, "Gmail: Connects cleanly");

    const statusRes1 = await fetch(`${BASE_URL}/api/email/status`, {
      headers: { cookie: sessionCookie },
    });
    const statusData1 = await statusRes1.json();
    assert(statusData1.gmailConnected === true, "Gmail: Status reflects connected=true");

    const gDisconnectRes = await fetch(`${BASE_URL}/api/email/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ provider: "gmail" }),
    });
    const gDisconnectData = await gDisconnectRes.json();
    assert(gDisconnectRes.status === 200 && gDisconnectData.connected === false, "Gmail: Disconnects cleanly");

    // Re-connect Gmail for sync tests
    await fetch(`${BASE_URL}/api/email/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ provider: "gmail" }),
    });

    // 3. TEST: Outlook Connect & Disconnect
    const oConnectRes = await fetch(`${BASE_URL}/api/email/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ provider: "outlook" }),
    });
    const oConnectData = await oConnectRes.json();
    assert(oConnectRes.status === 200 && oConnectData.connected === true, "Outlook: Connects cleanly");

    const statusRes2 = await fetch(`${BASE_URL}/api/email/status`, {
      headers: { cookie: sessionCookie },
    });
    const statusData2 = await statusRes2.json();
    assert(
      statusData2.gmailConnected === true && statusData2.outlookConnected === true,
      "Both Inboxes: Status reports both Gmail and Outlook connected simultaneously"
    );

    // 4. TEST: Confirmation email auto-creates application
    const confirmationEmail = {
      provider: "gmail" as const,
      messageId: `msg-confirm-${Date.now()}`,
      date: new Date(),
      sender: "Tesla Recruiting <careers@tesla.com>",
      subject: "Thank you for applying to Tesla - Autopilot Software Engineer",
      snippet: "We received your application for the Autopilot Software Engineer role. Our talent team will review your application.",
    };

    const syncRes1 = await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [confirmationEmail] }),
    });
    const syncData1 = await syncRes1.json();
    assert(
      syncRes1.status === 200 && syncData1.result.newApplicationsCreated === 1,
      "Sync: Confirmation email successfully created new application"
    );

    const teslaApp = await prisma.application.findFirst({
      where: { userId: user.id, company: { contains: "Tesla", mode: "insensitive" } },
      include: { emailEvents: true },
    });
    assert(
      !!teslaApp && teslaApp.stage === "Applied",
      "Application: Tesla application saved in PostgreSQL with stage='Applied'"
    );
    assert(
      teslaApp?.emailEvents.length === 1,
      "Detail Panel Link: Email linked to the Tesla application in database"
    );

    // 5. TEST: Assessment Invite updates stage to 'Assessment'
    const assessmentEmail = {
      provider: "gmail" as const,
      messageId: `msg-oa-${Date.now()}`,
      date: new Date(),
      sender: "HackerRank on behalf of Tesla <recruit@hackerrank.net>",
      subject: "Tesla Technical Coding Challenge Invitation",
      snippet: "Please complete your HackerRank online assessment for Autopilot Software Engineer within 5 days.",
    };

    const syncRes2 = await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [assessmentEmail] }),
    });
    const syncData2 = await syncRes2.json();
    assert(
      syncRes2.status === 200 && syncData2.result.stagesUpdated === 1,
      "Stage Update: Assessment invite updated matching application stage"
    );

    const teslaAppAfterOA = await prisma.application.findUnique({ where: { id: teslaApp!.id } });
    assert(teslaAppAfterOA?.stage === "Assessment", "Stage: Tesla stage advanced to 'Assessment'");

    // 6. TEST: Interview Invite updates stage to 'Interviewing'
    const interviewEmail = {
      provider: "outlook" as const,
      messageId: `msg-interview-${Date.now()}`,
      date: new Date(),
      sender: "Tesla Talent <talent@tesla.com>",
      subject: "Invitation to Interview: Tesla Autopilot Team",
      snippet: "We would like to schedule your virtual onsite technical interview rounds for next week.",
    };

    await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [interviewEmail] }),
    });

    const teslaAfterInterview = await prisma.application.findUnique({ where: { id: teslaApp!.id } });
    assert(teslaAfterInterview?.stage === "Interviewing", "Stage: Tesla stage advanced to 'Interviewing'");

    // 7. TEST: Offer Email updates stage to 'Offer'
    const offerEmail = {
      provider: "outlook" as const,
      messageId: `msg-offer-${Date.now()}`,
      date: new Date(),
      sender: "Tesla Executive Talent <executive@tesla.com>",
      subject: "Offer of Employment - Tesla Autopilot Software Engineer",
      snippet: "We are pleased to offer you the position of Autopilot Software Engineer at Tesla with our formal compensation package.",
    };

    await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [offerEmail] }),
    });

    const teslaAfterOffer = await prisma.application.findUnique({ where: { id: teslaApp!.id } });
    assert(teslaAfterOffer?.stage === "Offer", "Stage: Tesla stage advanced to 'Offer'");

    // 8. TEST: Rejection Email updates stage to 'Rejected'
    const rejectionEmail = {
      provider: "gmail" as const,
      messageId: `msg-rej-${Date.now()}`,
      date: new Date(),
      sender: "Tesla HR <hr@tesla.com>",
      subject: "Update on your application to Tesla",
      snippet: "After careful review, we have decided to pursue other candidates whose qualifications more closely align.",
    };

    await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [rejectionEmail] }),
    });

    const teslaAfterRejection = await prisma.application.findUnique({ where: { id: teslaApp!.id } });
    assert(teslaAfterRejection?.stage === "Rejected", "Stage: Tesla stage updated to 'Rejected'");

    // 9. TEST: De-duplication across inboxes (Gmail + Outlook with same email)
    const duplicateEmailInOutlook = {
      provider: "outlook" as const,
      messageId: `msg-dup-check-${Date.now()}`,
      date: new Date(),
      sender: "Tesla Recruiting <careers@tesla.com>",
      subject: "Thank you for applying to Tesla - Autopilot Software Engineer",
      snippet: "We received your application for the Autopilot Software Engineer role.",
    };

    const dupSyncRes = await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [duplicateEmailInOutlook] }),
    });
    const dupSyncData = await dupSyncRes.json();
    assert(
      dupSyncData.result.duplicatesSkipped === 1 && dupSyncData.result.newApplicationsCreated === 0,
      "De-duplication: Cross-provider duplicate email skipped with zero duplicate applications"
    );

    const teslaTotalCount = await prisma.application.count({
      where: { userId: user.id, company: { contains: "Tesla", mode: "insensitive" } },
    });
    assert(teslaTotalCount === 1, "De-duplication: Exactly 1 Tesla application exists in database");

    // 10. TEST: Needs-Review Queue for low-confidence matches
    const lowConfidenceEmail = {
      provider: "gmail" as const,
      messageId: `msg-lowconf-${Date.now()}`,
      date: new Date(),
      sender: "Notification Service <no-reply@genericportal.org>",
      subject: "Status Update",
      snippet: "Your inquiry regarding status has been noted.",
    };

    const lowConfSyncRes = await fetch(`${BASE_URL}/api/email/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({ messages: [lowConfidenceEmail] }),
    });
    const lowConfSyncData = await lowConfSyncRes.json();
    assert(
      lowConfSyncData.result.needsReviewCount === 1,
      "Needs Review: Low confidence email placed into review queue"
    );

    // Verify item in Needs-Review API
    const reviewRes = await fetch(`${BASE_URL}/api/email/needs-review`, {
      headers: { cookie: sessionCookie },
    });
    const reviewData = await reviewRes.json();
    const queuedItem = reviewData.items.find((i: any) => i.messageId === lowConfidenceEmail.messageId);
    assert(!!queuedItem, "Needs Review API: Queued item visible in /api/email/needs-review");

    // Resolve review item by approving as new application
    const resolveRes = await fetch(`${BASE_URL}/api/email/needs-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({
        eventId: queuedItem.id,
        action: "approve",
        company: "OpenAI",
        role: "Systems Research Engineer",
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveData.success === true, "Needs Review: Item successfully approved and resolved");

    const openAiApp = await prisma.application.findFirst({
      where: { userId: user.id, company: "OpenAI" },
    });
    assert(!!openAiApp, "Needs Review: New application created from approved review item");

    // 11. TEST: Email bodies never stored in database
    const allEmails = await prisma.emailEvent.findMany({ where: { userId: user.id } });
    const hasAnyFullBodyField = allEmails.some((e: any) => e.body !== undefined);
    const maxSnippetLength = Math.max(...allEmails.map((e) => e.snippet.length));
    assert(
      !hasAnyFullBodyField && maxSnippetLength <= 300,
      "Privacy: Full email bodies are never stored; only snippets (<= 300 chars) and metadata"
    );

  } catch (err) {
    console.error("Test execution error:", err);
    assert(false, "Test Suite Run", String(err));
  }

  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("==================================================");

  await prisma.$disconnect();
  await pool.end();

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runPhase4And5Tests().catch((e) => {
  console.error("Phase 4 & 5 test runner crashed:", e);
  process.exit(1);
});
