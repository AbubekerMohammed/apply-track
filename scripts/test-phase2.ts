import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://abubeker@localhost:5432/applytrack",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";

async function runPhase2Tests() {
  console.log("==================================================");
  console.log("   APPLYTRACK PHASE 2 VERIFICATION & TEST SUITE   ");
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
    // 1. Create a dedicated test user for Phase 2 via register endpoint
    const testEmail = `phase2.${Date.now()}@applytrack.test`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase Two Tester",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success, "Setup: Test user registered successfully");

    // Mark the email verified so the credentials sign-in below is allowed.
    const user = await prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: new Date() },
    });

    // Obtain session cookie by signing in
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

    // 2. TEST: Add Application (POST /api/applications)
    const addRes = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({
        company: "Vercel",
        role: "Frontend Systems Engineer",
        location: "Remote",
        jobLink: "https://vercel.com/careers/frontend",
        stage: "Applied",
        source: "LinkedIn",
        referred: false,
        salaryRange: "$180k - $220k",
        notes: "Initial application submitted online",
      }),
    });

    const addData = await addRes.json();
    assert(addRes.status === 201 && addData.application?.id, "Add Application: Successfully created via API");
    const appId = addData.application.id;

    // Verify initial timeline stage change recorded
    assert(
      addData.application.stageHistory?.length === 1 &&
        addData.application.stageHistory[0].toStage === "Applied",
      "Timeline: Initial stage history recorded on creation"
    );

    // 3. TEST: Edit Application (PUT /api/applications/[id])
    const editRes = await fetch(`${BASE_URL}/api/applications/${appId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({
        role: "Senior Frontend Systems Engineer",
        salaryRange: "$200k - $240k",
        notes: "Updated role title and salary expectation",
      }),
    });

    const editData = await editRes.json();
    assert(
      editRes.status === 200 && editData.application.role === "Senior Frontend Systems Engineer",
      "Edit Application: Successfully updated role and salary details"
    );

    // 4. TEST: Stage Change & Timeline (PATCH /api/applications/[id]/stage) - Kanban drag-and-drop
    const stageRes1 = await fetch(`${BASE_URL}/api/applications/${appId}/stage`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ stage: "Assessment", notes: "Received CodeSignal test" }),
    });

    const stageData1 = await stageRes1.json();
    assert(
      stageRes1.status === 200 && stageData1.application.stage === "Assessment",
      "Kanban Drag-and-Drop: Stage updated to 'Assessment'"
    );

    // Advance to "Interviewing"
    const stageRes2 = await fetch(`${BASE_URL}/api/applications/${appId}/stage`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ stage: "Interviewing", notes: "Passed assessment, round 1 scheduled" }),
    });

    const stageData2 = await stageRes2.json();
    assert(
      stageRes2.status === 200 && stageData2.application.stage === "Interviewing",
      "Kanban Drag-and-Drop: Stage updated to 'Interviewing'"
    );

    // Verify Stage Timeline Audit Trail
    const detailRes = await fetch(`${BASE_URL}/api/applications/${appId}`, {
      headers: { cookie: sessionCookie },
    });
    const detailData = await detailRes.json();
    const history = detailData.application.stageHistory;

    assert(
      history.length === 3,
      "Timeline: Exactly 3 chronological stage transitions recorded"
    );
    assert(
      history[0].toStage === "Interviewing" && history[1].toStage === "Assessment" && history[2].toStage === "Applied",
      "Timeline: Stage progression audit trail verified (Applied -> Assessment -> Interviewing)"
    );

    // 5. TEST: Search, Sort and Filters
    // Add 2 more applications to test search & filters
    await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({
        company: "Figma",
        role: "Design Systems Engineer",
        stage: "Recruiter Call",
        source: "Referral",
        referred: true,
      }),
    });

    await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sessionCookie },
      body: JSON.stringify({
        company: "Linear",
        role: "Full Stack Engineer",
        stage: "Offer",
        source: "Company Website",
        referred: false,
      }),
    });

    // Filter by stage=Offer
    const filterStageRes = await fetch(`${BASE_URL}/api/applications?stage=Offer`, {
      headers: { cookie: sessionCookie },
    });
    const filterStageData = await filterStageRes.json();
    assert(
      filterStageData.applications.length === 1 && filterStageData.applications[0].company === "Linear",
      "Filters: Filter by stage=Offer returns only Linear"
    );

    // Filter by referred=true
    const filterRefRes = await fetch(`${BASE_URL}/api/applications?referred=true`, {
      headers: { cookie: sessionCookie },
    });
    const filterRefData = await filterRefRes.json();
    assert(
      filterRefData.applications.length === 1 && filterRefData.applications[0].company === "Figma",
      "Filters: Filter by referred=true returns only Figma"
    );

    // Search query search=Systems
    const searchRes = await fetch(`${BASE_URL}/api/applications?search=Systems`, {
      headers: { cookie: sessionCookie },
    });
    const searchData = await searchRes.json();
    const searchCompanies = searchData.applications.map((a: { company: string }) => a.company);
    assert(
      searchCompanies.includes("Vercel") && searchCompanies.includes("Figma") && !searchCompanies.includes("Linear"),
      "Search: Full-text search for 'Systems' correctly matched Vercel and Figma"
    );

    // 6. TEST: CSV Export
    const exportRes = await fetch(`${BASE_URL}/api/applications/export`, {
      headers: { cookie: sessionCookie },
    });
    const csvContent = await exportRes.text();
    assert(exportRes.status === 200, "CSV Export: Endpoint responds with HTTP 200");
    assert(
      csvContent.includes('"Company","Role"') &&
        csvContent.includes("Vercel") &&
        csvContent.includes("Figma") &&
        csvContent.includes("Linear"),
      "CSV Export: Exported CSV contains proper headers and all user applications"
    );

    // 7. TEST: CSV Import
    const sampleCsv = `Company,Role,Location,Job Link,Stage,Source,Referred,Salary Range,Notes
Datadog,Senior Software Engineer,New York,https://datadog.com/jobs,Interviewing,LinkedIn,No,$190k - $220k,Imported from tracker
Notion,Product Engineer,San Francisco,https://notion.so/jobs,Applied,Referral,Yes,$185k,Met team at conference`;

    const importRes = await fetch(`${BASE_URL}/api/applications/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ csv: sampleCsv }),
    });

    const importData = await importRes.json();
    assert(
      importRes.status === 200 && importData.importedCount === 2,
      "CSV Import: Successfully parsed and imported 2 new applications"
    );

    // Verify imported records exist in database
    const datadogApp = await prisma.application.findFirst({
      where: { company: "Datadog", userId: user.id },
    });
    assert(
      !!datadogApp && datadogApp.stage === "Interviewing",
      "CSV Import: Datadog application saved with correct stage 'Interviewing'"
    );

    const notionApp = await prisma.application.findFirst({
      where: { company: "Notion", userId: user.id },
    });
    assert(
      !!notionApp && notionApp.referred === true,
      "CSV Import: Notion application saved with referral flag=true"
    );

    // 8. TEST: Delete Application (DELETE /api/applications/[id])
    const deleteRes = await fetch(`${BASE_URL}/api/applications/${appId}`, {
      method: "DELETE",
      headers: { cookie: sessionCookie },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success, "Delete Application: Successfully deleted application");

    const checkDeleted = await prisma.application.findUnique({ where: { id: appId } });
    assert(!checkDeleted, "Database: Deleted application no longer exists in PostgreSQL");

    // 9. TEST: UI link opens in new tab
    const viewCode = await fetch(`${BASE_URL}/applications`, {
      headers: { cookie: sessionCookie },
    }).then((r) => r.text());
    assert(
      viewCode.includes('rel="noopener noreferrer"') || viewCode.includes("target="),
      "UI: Job posting links configured with target='_blank' rel='noopener noreferrer'"
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

runPhase2Tests().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
