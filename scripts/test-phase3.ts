import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://abubeker@localhost:5432/applytrack",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";

async function runPhase3Tests() {
  console.log("==================================================");
  console.log("   APPLYTRACK PHASE 3 VERIFICATION & TEST SUITE   ");
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
    // 1. Create a dedicated test user for Phase 3 with dailyGoal = 5
    const testEmail = `phase3.${Date.now()}@applytrack.test`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase Three Tester",
        email: testEmail,
        password: "Password123!",
      }),
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    await prisma.user.update({
      where: { id: user.id },
      // Mark the email verified so the credentials sign-in below is allowed.
      data: { dailyGoal: 5, emailVerified: new Date() },
    });

    // Obtain session cookie
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

    // 2. Seed known test applications across stages and dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // 3 applications applied today
    await prisma.application.createMany({
      data: [
        {
          userId: user.id,
          company: "Airbnb",
          role: "Frontend Engineer",
          stage: "Applied",
          dateApplied: today,
        },
        {
          userId: user.id,
          company: "Uber",
          role: "Senior iOS Engineer",
          stage: "Assessment",
          dateApplied: today,
        },
        {
          userId: user.id,
          company: "Lyft",
          role: "Staff Engineer",
          stage: "Recruiter Call",
          dateApplied: today,
        },
      ],
    });

    // 2 applications applied yesterday
    await prisma.application.createMany({
      data: [
        {
          userId: user.id,
          company: "DoorDash",
          role: "Fullstack Engineer",
          stage: "Interviewing",
          dateApplied: yesterday,
        },
        {
          userId: user.id,
          company: "Instacart",
          role: "Software Engineer",
          stage: "Offer",
          dateApplied: yesterday,
        },
      ],
    });

    // 1 rejection applied 2 days ago
    await prisma.application.create({
      data: {
        userId: user.id,
        company: "Meta",
        role: "Production Engineer",
        stage: "Rejected",
        dateApplied: twoDaysAgo,
      },
    });

    // Seed Today's Focus items:
    // A. 1 Target Company with "Needs referral"
    await prisma.targetCompany.create({
      data: {
        userId: user.id,
        name: "Anthropic",
        priority: "High",
        targetRole: "Research Engineer",
        status: "Needs referral",
      },
    });

    // B. 1 Contact with follow-up due
    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name: "Sarah Chen",
        company: "Anthropic",
        email: "sarah@anthropic.com",
      },
    });

    await prisma.outreach.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        channel: "LinkedIn",
        response: "Pending",
        followUpDate: new Date(),
      },
    });

    // 3. TEST: Fetch /api/dashboard/stats
    const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { cookie: sessionCookie },
    });
    const statsData = await statsRes.json();

    // Verify Stat Cards accuracy
    assert(statsData.stats.applied === 6, "Stats: Total applied equals 6");
    assert(statsData.stats.assessments === 1, "Stats: Assessments count equals 1 (Uber)");
    assert(statsData.stats.recruiterCalls === 1, "Stats: Recruiter calls count equals 1 (Lyft)");
    assert(statsData.stats.interviews === 1, "Stats: Interviews count equals 1 (DoorDash)");
    assert(statsData.stats.offers === 1, "Stats: Offers count equals 1 (Instacart)");
    assert(statsData.stats.rejections === 1, "Stats: Rejections count equals 1 (Meta)");
    assert(
      statsData.stats.heardBack === 5,
      "Stats: Heard back equals 5 (1 Assessment + 1 Recruiter + 1 Interview + 1 Offer + 1 Rejected)"
    );
    // Response rate: 5 / 6 * 100 = 83%
    assert(statsData.stats.responseRate === 83, "Stats: Response rate calculated accurately as 83%");

    // Verify Goal Ring and Streak
    assert(statsData.goal.dailyGoal === 5, "Goal Ring: User custom daily goal reflects 5");
    assert(statsData.goal.appliedToday === 3, "Goal Ring: 3 applications recorded for today");
    assert(statsData.goal.percentage === 60, "Goal Ring: Percentage is 60% (3 / 5)");
    assert(statsData.goal.streak === 3, "Streak: 3 consecutive days streak (Today, Yesterday, 2 days ago)");

    // Verify All Three Charts
    // A. 30 Days velocity
    assert(
      Array.isArray(statsData.charts.applicationsPerDay) &&
        statsData.charts.applicationsPerDay.length === 30,
      "Charts: 30-day velocity dataset contains exactly 30 days"
    );
    const todayEntry = statsData.charts.applicationsPerDay[29];
    assert(todayEntry.count === 3, "Charts: Last day in 30-day chart correctly has 3 applications");

    // B. Funnel
    assert(
      Array.isArray(statsData.charts.funnel) && statsData.charts.funnel.length === 5,
      "Charts: Applied-to-Offer funnel contains 5 stages"
    );
    assert(
      statsData.charts.funnel[0].count === 6 && statsData.charts.funnel[4].count === 1,
      "Charts: Funnel ranges from 6 Applied to 1 Offer"
    );

    // C. Heatmap
    assert(
      Array.isArray(statsData.charts.heatmap) && statsData.charts.heatmap.length === 84,
      "Charts: GitHub-style heatmap contains 84 day cells (12 weeks)"
    );

    // Verify Today's Focus contains real items
    assert(
      statsData.todaysFocus.referralsNeeded.length === 1 &&
        statsData.todaysFocus.referralsNeeded[0].name === "Anthropic",
      "Today's Focus: Shows real referral needed for 'Anthropic'"
    );

    assert(
      statsData.todaysFocus.followUpsDue.length === 1 &&
        statsData.todaysFocus.followUpsDue[0].contactName === "Sarah Chen",
      "Today's Focus: Shows real follow-up due for contact 'Sarah Chen'"
    );

    assert(
      statsData.todaysFocus.pendingAssessments.length === 1 &&
        statsData.todaysFocus.pendingAssessments[0].company === "Uber",
      "Today's Focus: Shows real pending assessment for 'Uber'"
    );

    // 4. TEST: Dashboard HTML Rendering & Click-to-filter links
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { cookie: sessionCookie },
    });
    const dashHtml = await dashRes.text();
    assert(dashRes.status === 200, "Dashboard: Page responds with HTTP 200");
    assert(
      dashHtml.includes("/applications?stage=Assessment") &&
        dashHtml.includes("/applications?stage=Interviewing") &&
        dashHtml.includes("/applications?stage=Offer") &&
        dashHtml.includes("/applications?stage=Rejected"),
      "Click-to-filter: Cards and funnel links route to filtered application views"
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

runPhase3Tests().catch((e) => {
  console.error("Phase 3 test runner crashed:", e);
  process.exit(1);
});
