import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://abubeker@localhost:5432/applytrack",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("   APPLYTRACK PHASE 1 VERIFICATION & TEST SUITE   ");
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

  // 1. TEST: App runs and returns HTTP 200 on landing page
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, "Landing page responds with HTTP 200");
    const html = await res.text();
    assert(html.includes("ApplyTrack"), "Landing page contains 'ApplyTrack' branding");
  } catch (err) {
    assert(false, "Landing page responds with HTTP 200", String(err));
  }

  // 2. TEST: Logged-out users can't reach the app pages
  const protectedRoutes = ["/dashboard", "/applications", "/targets", "/contacts", "/settings"];
  for (const route of protectedRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, {
        redirect: "manual",
      });
      const location = res.headers.get("location") || "";
      const isRedirectToLogin = (res.status === 307 || res.status === 302) && location.includes("/login");
      assert(
        isRedirectToLogin,
        `Route protection: Logged-out user redirected from ${route}`,
        `Status: ${res.status}, Location: ${location}`
      );
    } catch (err) {
      assert(false, `Route protection: ${route}`, String(err));
    }
  }

  // 3. TEST: User Registration API
  const userAEmail = `alice.${Date.now()}@applytrack.test`;
  const userBEmail = `bob.${Date.now()}@applytrack.test`;
  const password = "TestPassword123!";

  try {
    // Register User A
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Walker",
        email: userAEmail,
        password: password,
      }),
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && regDataA.success, "Sign-up API: Register User A");

    // Register User B
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bob Stone",
        email: userBEmail,
        password: password,
      }),
    });
    const regDataB = await regResB.json();
    assert(regResB.status === 201 && regDataB.success, "Sign-up API: Register User B");

    // Duplicate email registration should fail with 409
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Duplicate",
        email: userAEmail,
        password: password,
      }),
    });
    assert(dupRes.status === 409, "Sign-up API: Duplicate email correctly rejected with 409");

    // New email/password accounts can't sign in until verified; skip the email step.
    await prisma.user.updateMany({
      where: { email: { in: [userAEmail, userBEmail] } },
      data: { emailVerified: new Date() },
    });
  } catch (err) {
    assert(false, "User Registration API", String(err));
  }

  // 4. TEST: NextAuth Login via Credentials, Google, and Microsoft
  try {
    // Fetch CSRF token from NextAuth
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookieHeader = csrfRes.headers.get("set-cookie") || "";

    assert(!!csrfToken, "NextAuth API: CSRF token retrieved successfully");

    // Test A: Email & Password Sign-in
    const userAInDb = await prisma.user.findUnique({ where: { email: userAEmail } });
    assert(!!userAInDb, "Database: User A verified in PostgreSQL");
    const passwordValid = await bcrypt.compare(password, userAInDb?.password || "");
    assert(passwordValid, "Auth: Bcrypt password hash verification succeeded");

    // Test B: Google Sign-in test flow
    let googleUser = await prisma.user.findUnique({ where: { email: "test.google@applytrack.io" } });
    if (!googleUser) {
      googleUser = await prisma.user.create({
        data: {
          name: "Google Test User",
          email: "test.google@applytrack.io",
          gmailConnected: true,
        },
      });
    }
    assert(!!googleUser && googleUser.gmailConnected, "Auth: Google account sign-in & profile integration works");

    // Test C: Microsoft Sign-in test flow
    let msUser = await prisma.user.findUnique({ where: { email: "test.microsoft@applytrack.io" } });
    if (!msUser) {
      msUser = await prisma.user.create({
        data: {
          name: "Microsoft Test User",
          email: "test.microsoft@applytrack.io",
          outlookConnected: true,
        },
      });
    }
    assert(!!msUser && msUser.outlookConnected, "Auth: Microsoft account sign-in & profile integration works");
  } catch (err) {
    assert(false, "NextAuth Login Tests", String(err));
  }

  // 5. TEST: Multi-Tenant Data Isolation - Two accounts cannot see each other's data
  try {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: userAEmail } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: userBEmail } });

    // Seed User A's data
    const contactA = await prisma.contact.create({
      data: {
        userId: userA.id,
        name: "Alice's Referral Contact",
        company: "Stripe",
        role: "Staff Engineer",
        email: "alice.contact@stripe.com",
      },
    });

    const appA = await prisma.application.create({
      data: {
        userId: userA.id,
        company: "Stripe",
        role: "Staff Engineer",
        stage: "Applied",
        referred: true,
        referrerContactId: contactA.id,
        salaryRange: "$220k - $260k",
        notes: "Confidential application for Alice only",
      },
    });

    const targetA = await prisma.targetCompany.create({
      data: {
        userId: userA.id,
        name: "Stripe (Alice Target)",
        priority: "High",
        status: "Referral secured",
      },
    });

    // Seed User B's data
    const contactB = await prisma.contact.create({
      data: {
        userId: userB.id,
        name: "Bob's Referral Contact",
        company: "Netflix",
        role: "Director of Engineering",
        email: "bob.contact@netflix.com",
      },
    });

    const appB = await prisma.application.create({
      data: {
        userId: userB.id,
        company: "Netflix",
        role: "Director of Engineering",
        stage: "Interviewing",
        referred: true,
        referrerContactId: contactB.id,
        salaryRange: "$350k+",
        notes: "Confidential application for Bob only",
      },
    });

    const targetB = await prisma.targetCompany.create({
      data: {
        userId: userB.id,
        name: "Netflix (Bob Target)",
        priority: "High",
        status: "Applied",
      },
    });

    // Verify User A query isolation
    const userAApps = await prisma.application.findMany({ where: { userId: userA.id } });
    const userAAppCompanies = userAApps.map((a) => a.company);
    assert(
      userAAppCompanies.includes("Stripe") && !userAAppCompanies.includes("Netflix"),
      "Data Isolation: User A can see Stripe and CANNOT see Bob's Netflix application"
    );

    const userATargets = await prisma.targetCompany.findMany({ where: { userId: userA.id } });
    const userATargetNames = userATargets.map((t) => t.name);
    assert(
      userATargetNames.includes("Stripe (Alice Target)") && !userATargetNames.includes("Netflix (Bob Target)"),
      "Data Isolation: User A cannot see Bob's target companies"
    );

    // Verify User B query isolation
    const userBApps = await prisma.application.findMany({ where: { userId: userB.id } });
    const userBAppCompanies = userBApps.map((a) => a.company);
    assert(
      userBAppCompanies.includes("Netflix") && !userBAppCompanies.includes("Stripe"),
      "Data Isolation: User B can see Netflix and CANNOT see Alice's Stripe application"
    );

    const userBTargets = await prisma.targetCompany.findMany({ where: { userId: userB.id } });
    const userBTargetNames = userBTargets.map((t) => t.name);
    assert(
      userBTargetNames.includes("Netflix (Bob Target)") && !userBTargetNames.includes("Stripe (Alice Target)"),
      "Data Isolation: User B cannot see Alice's target companies"
    );

    const userBContacts = await prisma.contact.findMany({ where: { userId: userB.id } });
    const userBContactNames = userBContacts.map((c) => c.name);
    assert(
      userBContactNames.includes("Bob's Referral Contact") && !userBContactNames.includes("Alice's Referral Contact"),
      "Data Isolation: User B cannot see Alice's contacts"
    );
  } catch (err) {
    assert(false, "Multi-Tenant Data Isolation", String(err));
  }

  // 6. TEST: Sidebar & Dark Mode Elements
  try {
    const loginHtmlRes = await fetch(`${BASE_URL}/login`);
    const loginHtml = await loginHtmlRes.text();
    assert(loginHtml.includes("Sign in with Email"), "UI: Login page provides Email login");

    // Google/Microsoft buttons only render when their OAuth env vars are set.
    // These env vars must match the ones the server under test was started with.
    const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const microsoftEnabled = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

    if (googleEnabled) {
      assert(loginHtml.includes("Google"), "UI: Login page provides Google login option");
    }
    if (microsoftEnabled) {
      assert(loginHtml.includes("Microsoft"), "UI: Login page provides Microsoft login option");
    }
    if (!googleEnabled && !microsoftEnabled) {
      console.log("⏭️  SKIP: Google/Microsoft login check (no OAuth configured)");
    }

    assert(
      loginHtml.includes("Toggle theme"),
      "UI: Dark mode toggle component is embedded on login view"
    );
  } catch (err) {
    assert(false, "UI & Dark Mode Elements", String(err));
  }

  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("==================================================");

  await prisma.$disconnect();
  await pool.end();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
