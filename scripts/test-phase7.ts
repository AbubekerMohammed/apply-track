import { prisma } from "../src/lib/prisma";
import { autoMarkGhostedApplications } from "../src/lib/ghosted";
import { processAICareerQuery } from "../src/lib/ai/assistant";
import { generateWeeklySummary } from "../src/lib/email/weekly-summary";
import bcrypt from "bcryptjs";

async function runPhase7Tests() {
  console.log("=== TRAILL PHASE 7 VERIFICATION SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    const email = `p7-user-${Date.now()}@example.com`;
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("\n1. Testing End-to-End User Registration & Auth Models...");
    const user = await prisma.user.create({
      data: {
        email,
        name: "Phase 7 Candidate",
        password: hashedPassword,
        dailyGoal: 10,
      },
    });

    assert(user.id !== null, "New user registered with unique ID");
    const isPasswordMatch = await bcrypt.compare(password, user.password!);
    assert(isPasswordMatch === true, "Password hashed and authenticated correctly");

    console.log("\n2. Seeding Test Dataset for AI, Ghosting & Weekly Summary...");
    const now = new Date();

    // 1 application submitted 10 days ago (last week)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const appLastWeek = await prisma.application.create({
      data: {
        userId: user.id,
        company: "Vercel",
        role: "Next.js Systems Engineer",
        stage: "Assessment",
        dateApplied: tenDaysAgo,
      },
    });

    // 1 application submitted 35 days ago (should be auto-marked as Ghosted)
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    const appOld = await prisma.application.create({
      data: {
        userId: user.id,
        company: "LegacyCorp",
        role: "Full Stack Engineer",
        stage: "Applied",
        dateApplied: thirtyFiveDaysAgo,
      },
    });

    // 1 recent application (today)
    const appToday = await prisma.application.create({
      data: {
        userId: user.id,
        company: "OpenAI",
        role: "Full Stack Platform Engineer",
        stage: "Interviewing",
        dateApplied: now,
      },
    });

    // 1 contact and pending follow-up
    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name: "David Kim",
        company: "Vercel",
        role: "VP of Product",
        email: "david@vercel.com",
        linkedInUrl: "https://linkedin.com/in/david-kim",
      },
    });

    const pastOutreachDate = new Date();
    pastOutreachDate.setDate(pastOutreachDate.getDate() - 8);
    const overdueFollowUp = await prisma.outreach.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        channel: "LinkedIn",
        date: pastOutreachDate,
        message: "Quick chat about Vercel frontend roles?",
        response: "Pending",
        followUpDate: pastOutreachDate, // Overdue
      },
    });

    // 1 target company needing referral
    const target = await prisma.targetCompany.create({
      data: {
        userId: user.id,
        name: "Stripe",
        targetRole: "Staff Software Engineer",
        priority: "High",
        status: "Needs referral",
      },
    });

    console.log("\n3. Testing AI Assistant Natural Language Queries...");
    // A. Query: "How many did I apply to last week?"
    const resLastWeek = await processAICareerQuery(user.id, "How many did I apply to last week?");
    assert(resLastWeek.category === "applications_count", "AI categorized query as applications_count");
    assert(resLastWeek.answer.includes("1 job application"), "AI accurately counted 1 application for last week");
    assert(resLastWeek.answer.includes("Vercel"), "AI identified Vercel in last week's submissions");

    // B. Query: "Who should I follow up with?"
    const resFollowUp = await processAICareerQuery(user.id, "Who should I follow up with?");
    assert(resFollowUp.category === "follow_ups", "AI categorized query as follow_ups");
    assert(resFollowUp.answer.includes("David Kim"), "AI recognized David Kim as pending follow-up");
    assert(resFollowUp.answer.includes("Follow-up is due now"), "AI highlighted overdue status");

    // C. Query: "Which target companies still need a referral?"
    const resTargets = await processAICareerQuery(user.id, "Which target companies still need a referral?");
    assert(resTargets.category === "targets", "AI categorized query as targets");
    assert(resTargets.answer.includes("Stripe"), "AI identified Stripe as needing a referral");

    // D. Query: "What is my response rate?"
    const resRate = await processAICareerQuery(user.id, "What is my response rate?");
    assert(resRate.category === "response_rate", "AI categorized query as response_rate");
    assert(resRate.answer.includes("Interviews"), "AI reported active interviews");

    console.log("\n4. Testing 30-Day Ghosted Auto-Marking...");
    const ghostScan = await autoMarkGhostedApplications(user.id);
    assert(ghostScan.markedCount === 1, "Exactly 1 application older than 30 days was detected");
    assert(ghostScan.applications[0].company === "LegacyCorp", "LegacyCorp was auto-marked as Ghosted");

    // Verify in database that stage changed to Ghosted and StageHistory was recorded
    const updatedAppOld = await prisma.application.findUnique({
      where: { id: appOld.id },
      include: { stageHistory: true },
    });
    assert(updatedAppOld?.stage === "Ghosted", "Application stage updated to 'Ghosted' in database");
    assert(updatedAppOld?.stageHistory.length === 1, "Stage history recorded auto-ghosting event");
    assert(
      updatedAppOld?.stageHistory[0].toStage === "Ghosted",
      "Stage history toStage matches 'Ghosted'"
    );

    // Verify recent apps were NOT ghosted
    const updatedAppToday = await prisma.application.findUnique({
      where: { id: appToday.id },
    });
    assert(updatedAppToday?.stage === "Interviewing", "Recent application remains unaffected in Interviewing stage");

    console.log("\n5. Testing Weekly Summary Email Generation...");
    const digest = await generateWeeklySummary(user.id);
    assert(digest !== null, "Weekly summary digest generated successfully");
    assert(digest!.recipientEmail === email, "Recipient email matches user account");
    assert(digest!.appliedCountThisWeek >= 1, "Digest captures applications from past 7 days");
    assert(digest!.html.includes("Traill Weekly Digest"), "HTML email contains Traill header");
    assert(digest!.html.includes("OpenAI"), "HTML email features recent applications");
    assert(digest!.pendingFollowUpsCount >= 1, "HTML email details pending follow-ups");

    console.log("\n6. Cleaning Up Test Data...");
    await prisma.stageHistory.deleteMany({ where: { applicationId: { in: [appLastWeek.id, appOld.id, appToday.id] } } });
    await prisma.outreach.deleteMany({ where: { userId: user.id } });
    await prisma.contact.deleteMany({ where: { userId: user.id } });
    await prisma.targetCompany.deleteMany({ where: { userId: user.id } });
    await prisma.application.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log("\n==============================================");
    console.log(`ALL PHASE 7 TESTS PASSED: ${passed}/${total}`);
    console.log("==============================================\n");
  } catch (err) {
    console.error("Phase 7 test failure:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase7Tests();
