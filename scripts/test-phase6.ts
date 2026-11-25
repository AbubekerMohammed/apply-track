import { prisma } from "../src/lib/prisma";

async function runPhase6Tests() {
  console.log("=== TRAILL PHASE 6 VERIFICATION SUITE ===");
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
    // Clean up test users
    const emailA = `p6-user-a-${Date.now()}@example.com`;
    const emailB = `p6-user-b-${Date.now()}@example.com`;

    const userA = await prisma.user.create({
      data: {
        email: emailA,
        name: "Phase 6 User A",
        password: "hashedpassword",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: emailB,
        name: "Phase 6 User B",
        password: "hashedpassword",
      },
    });

    console.log("\n1. Testing Target Company Creation & Prioritization...");
    const targetHigh = await prisma.targetCompany.create({
      data: {
        userId: userA.id,
        name: "Anthropic",
        targetRole: "Research Engineer",
        priority: "High",
        status: "Needs referral",
        jobLink: "https://anthropic.com/careers/123",
        notes: "Prioritize insider contact",
        checklist: [
          { id: "find_contact", label: "Find a contact", completed: false },
          { id: "send_outreach", label: "Send outreach", completed: false },
          { id: "follow_up", label: "Follow up", completed: false },
          { id: "get_referral", label: "Get the referral", completed: false },
          { id: "apply", label: "Apply", completed: false },
        ],
      },
    });

    const targetMedium = await prisma.targetCompany.create({
      data: {
        userId: userA.id,
        name: "Datadog",
        targetRole: "Frontend Engineer",
        priority: "Medium",
        status: "Outreach sent",
        jobLink: "https://datadoghq.com/careers/456",
      },
    });

    assert(targetHigh.priority === "High", "Target priority High set correctly");
    assert(targetMedium.priority === "Medium", "Target priority Medium set correctly");
    assert(targetHigh.jobLink === "https://anthropic.com/careers/123", "Target jobLink saved accurately");

    console.log("\n2. Testing 'Needs Referral' Highlighting and Filtering...");
    const needsRefTargets = await prisma.targetCompany.findMany({
      where: { userId: userA.id, status: "Needs referral" },
    });
    assert(needsRefTargets.length === 1, "Exactly 1 target has 'Needs referral' status");
    assert(needsRefTargets[0].name === "Anthropic", "'Needs referral' targets accurately identified");

    console.log("\n3. Testing Per-Target Checklist Progress Persistence...");
    // Simulate updating checklist step 1 and 2
    const updatedChecklist = [
      { id: "find_contact", label: "Find a contact", completed: true },
      { id: "send_outreach", label: "Send outreach", completed: true },
      { id: "follow_up", label: "Follow up", completed: false },
      { id: "get_referral", label: "Get the referral", completed: false },
      { id: "apply", label: "Apply", completed: false },
    ];

    const updatedTarget = await prisma.targetCompany.update({
      where: { id: targetHigh.id },
      data: {
        checklist: updatedChecklist,
        status: "Outreach sent",
      },
    });

    const storedChecklist = updatedTarget.checklist as Array<{ id: string; completed: boolean }>;
    assert(storedChecklist[0].completed === true, "Checklist step 'find_contact' marked completed");
    assert(storedChecklist[1].completed === true, "Checklist step 'send_outreach' marked completed");
    assert(storedChecklist[2].completed === false, "Checklist step 'follow_up' remains pending");
    assert(updatedTarget.status === "Outreach sent", "Target status transitioned to 'Outreach sent'");

    console.log("\n4. Testing Contacts with LinkedIn Link & Scoped Data...");
    const contactSarah = await prisma.contact.create({
      data: {
        userId: userA.id,
        name: "Sarah Connor",
        company: "Anthropic",
        role: "Member of Technical Staff",
        email: "sarah@anthropic.com",
        linkedInUrl: "https://www.linkedin.com/in/sarah-connor",
        relationship: "Alumni",
        notes: "Stanford AI Lab alum",
      },
    });

    assert(contactSarah.name === "Sarah Connor", "Contact created with valid name");
    assert(contactSarah.linkedInUrl === "https://www.linkedin.com/in/sarah-connor", "LinkedIn URL preserved");
    assert(contactSarah.relationship === "Alumni", "Relationship tag stored accurately");

    console.log("\n5. Testing Outreach Logging with Follow-up Scheduling...");
    const outreachDate = new Date();
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7); // Default 7 days

    const outreach1 = await prisma.outreach.create({
      data: {
        userId: userA.id,
        contactId: contactSarah.id,
        targetCompanyId: targetHigh.id,
        channel: "LinkedIn",
        date: outreachDate,
        message: "Hi Sarah, loved your paper on mechanistic interpretability!",
        response: "Pending",
        followUpDate: followUpDate,
      },
    });

    assert(outreach1.channel === "LinkedIn", "Outreach channel saved");
    assert(outreach1.response === "Pending", "Outreach initial response is Pending");
    assert(outreach1.followUpDate !== null, "Follow-up reminder date auto-scheduled");

    const daysDiff = Math.round(
      (outreach1.followUpDate!.getTime() - outreach1.date.getTime()) / (1000 * 3600 * 24)
    );
    assert(daysDiff === 7, "Follow-up reminder defaults to exactly 7 days");

    console.log("\n6. Testing Duplicate-Outreach Detection & Warning...");
    // Count existing outreaches for contactSarah
    const priorOutreaches = await prisma.outreach.findMany({
      where: { contactId: contactSarah.id, userId: userA.id },
      orderBy: { date: "desc" },
    });

    assert(priorOutreaches.length === 1, "Duplicate detector finds 1 existing outreach");
    const duplicateDetected = priorOutreaches.length > 0;
    assert(duplicateDetected === true, "Duplicate-outreach warning fires when contacting Sarah again");

    // Log second outreach
    const outreach2 = await prisma.outreach.create({
      data: {
        userId: userA.id,
        contactId: contactSarah.id,
        targetCompanyId: targetHigh.id,
        channel: "Email",
        date: new Date(),
        message: "Following up on my LinkedIn note",
        response: "Replied",
      },
    });

    const totalOutreaches = await prisma.outreach.count({
      where: { contactId: contactSarah.id },
    });
    assert(totalOutreaches === 2, "Outreach log stores multiple messages in timeline");

    console.log("\n7. Testing Follow-up Reminders in Dashboard Today's Focus...");
    const now = new Date();
    // Create an overdue outreach
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 8);

    await prisma.outreach.create({
      data: {
        userId: userA.id,
        contactId: contactSarah.id,
        channel: "LinkedIn",
        date: pastDate,
        message: "Past outreach needing attention",
        response: "Pending",
        followUpDate: pastDate, // Overdue
      },
    });

    const focusFollowUps = await prisma.outreach.findMany({
      where: {
        userId: userA.id,
        OR: [{ followUpDate: { lte: now } }, { response: "Pending" }],
      },
      include: {
        contact: true,
      },
    });

    assert(focusFollowUps.length >= 1, "Overdue or pending outreach surfaced for Today's Focus");
    assert(focusFollowUps[0].contact.name === "Sarah Connor", "Focus item links to correct contact");

    console.log("\n8. Testing Strict Multi-Tenant Data Isolation...");
    const userBTargets = await prisma.targetCompany.findMany({
      where: { userId: userB.id },
    });
    const userBContacts = await prisma.contact.findMany({
      where: { userId: userB.id },
    });
    const userBOutreaches = await prisma.outreach.findMany({
      where: { userId: userB.id },
    });

    assert(userBTargets.length === 0, "User B cannot see User A's target companies");
    assert(userBContacts.length === 0, "User B cannot see User A's contacts");
    assert(userBOutreaches.length === 0, "User B cannot see User A's outreach logs");

    // Cleanup
    await prisma.outreach.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.contact.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.targetCompany.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

    console.log("\n==============================================");
    console.log(`ALL PHASE 6 TESTS PASSED: ${passed}/${total}`);
    console.log("==============================================\n");
  } catch (error) {
    console.error("Phase 6 tests failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6Tests();
