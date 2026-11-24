import { NormalizedEmailMessage, ExtractedEmailData } from "./email-provider";

const KNOWN_PLATFORMS = [
  "hackerrank",
  "codesignal",
  "codility",
  "karat",
  "hirevue",
  "greenhouse",
  "lever",
  "workday",
  "ashby",
  "jobvite",
  "smartrecruiters",
];

export async function classifyEmail(
  message: NormalizedEmailMessage
): Promise<ExtractedEmailData> {
  const text = `${message.subject} ${message.snippet}`.toLowerCase();
  const subject = message.subject.toLowerCase();
  const sender = message.sender.toLowerCase();

  // If an external LLM key is provided (OpenAI or Gemini), we can call it.
  // Otherwise, our production regex and semantic rules execute with deterministic scoring.
  let classification: ExtractedEmailData["classification"] = "other";
  let confidence = 0.5;
  let platform: string | undefined = undefined;

  for (const p of KNOWN_PLATFORMS) {
    if (text.includes(p) || sender.includes(p)) {
      platform = p.charAt(0).toUpperCase() + p.slice(1);
      break;
    }
  }

  // 1. Assessment Invite
  if (
    text.includes("codesignal") ||
    text.includes("hackerrank") ||
    text.includes("codility") ||
    text.includes("karat") ||
    text.includes("online assessment") ||
    text.includes("coding challenge") ||
    text.includes("technical assessment") ||
    text.includes("complete your assessment") ||
    text.includes("take-home") ||
    subject.includes("assessment invitation")
  ) {
    classification = "assessment_invite";
    confidence = text.includes("codesignal") || text.includes("hackerrank") ? 0.95 : 0.85;
  }
  // 2. Offer
  else if (
    text.includes("offer letter") ||
    text.includes("offer of employment") ||
    text.includes("pleased to offer") ||
    text.includes("congratulations on your offer") ||
    (subject.includes("offer") && text.includes("compensation")) ||
    (subject.includes("offer") && text.includes("welcome to the team"))
  ) {
    classification = "offer";
    confidence = 0.95;
  }
  // 3. Rejection
  else if (
    text.includes("not moving forward") ||
    text.includes("decided not to proceed") ||
    text.includes("pursue other candidates") ||
    text.includes("other applicants whose qualifications") ||
    text.includes("unfortunately, we have decided") ||
    text.includes("will not be moving forward") ||
    text.includes("regret to inform you") ||
    text.includes("after careful consideration") ||
    (subject.includes("update") && text.includes("wishing you the best in your job search"))
  ) {
    classification = "rejection";
    confidence = 0.92;
  }
  // 4. Interview Invite
  else if (
    text.includes("invitation to interview") ||
    text.includes("schedule your interview") ||
    text.includes("schedule an interview") ||
    text.includes("technical interview") ||
    text.includes("next round of interviews") ||
    text.includes("phone interview") ||
    text.includes("panel interview") ||
    text.includes("virtual onsite") ||
    text.includes("hiring manager interview") ||
    (text.includes("availability") && text.includes("interview"))
  ) {
    classification = "interview_invite";
    confidence = 0.88;
  }
  // 5. Recruiter Outreach / Scheduling
  else if (
    text.includes("recruiter screen") ||
    text.includes("introductory chat") ||
    text.includes("quick phone screen") ||
    text.includes("connect for 15 minutes") ||
    text.includes("quick 15-minute chat") ||
    text.includes("impressed by your profile") ||
    text.includes("wanted to reach out regarding a role") ||
    text.includes("speak with a member of our talent team")
  ) {
    classification = "recruiter_outreach";
    confidence = 0.85;
  }
  // 6. Application Confirmation
  else if (
    text.includes("thank you for applying") ||
    text.includes("thanks for applying") ||
    text.includes("application received") ||
    text.includes("we have received your application") ||
    text.includes("we received your application") ||
    text.includes("application has been submitted") ||
    text.includes("your application for") ||
    subject.includes("application submitted") ||
    subject.includes("application confirmation")
  ) {
    classification = "application_confirmation";
    confidence = 0.93;
  }

  // Extract Company Name
  const company = extractCompany(message);

  // Extract Role
  const role = extractRole(message);

  // Determine whether it needs manual user review
  // Confidence threshold < 0.75, or generic/missing company or role
  const needsReview =
    confidence < 0.75 ||
    classification === "other" ||
    !company ||
    company.toLowerCase() === "careers" ||
    company.toLowerCase() === "jobs" ||
    company.toLowerCase() === "recruiting" ||
    !role ||
    role.toLowerCase() === "position";

  return {
    company: company || "Unknown Company",
    role: role || "Software Engineer",
    date: message.date,
    classification,
    confidence: needsReview ? Math.min(confidence, 0.65) : confidence,
    needsReview,
    platform,
  };
}

function extractCompany(message: NormalizedEmailMessage): string {
  const subject = message.subject;
  const sender = message.sender;

  // 1. Check corporate sender domain or sender name first
  const senderMatch = sender.match(/(?:^"?([^"<]+)"?\s*)?<[^@]+@([^>]+)>/);
  if (senderMatch) {
    const senderName = (senderMatch[1] || "").trim();
    const domain = (senderMatch[2] || "").trim().toLowerCase();

    // Check clean corporate domain (e.g. talent@tesla.com -> Tesla)
    if (domain && !domain.includes("gmail") && !domain.includes("outlook") && !domain.includes("yahoo")) {
      const parts = domain.split(".");
      if (parts.length >= 2) {
        const rootDomain = parts[parts.length - 2];
        if (
          !KNOWN_PLATFORMS.includes(rootDomain) &&
          rootDomain !== "mail" &&
          rootDomain !== "email" &&
          !isGenericWord(rootDomain)
        ) {
          return rootDomain.charAt(0).toUpperCase() + rootDomain.slice(1);
        }
      }
    }

    // Check sender display name (e.g. "Tesla Talent" -> Tesla)
    if (senderName) {
      const cleaned = senderName
        .replace(/(recruiting|careers|team|talent|jobs|hiring|via greenhouse|via lever|via ashby)/gi, "")
        .trim();
      if (cleaned.length > 1 && !isGenericWord(cleaned)) {
        return cleaned;
      }
    }
  }

  // 2. Check "on behalf of [Company]"
  const onBehalfMatch = (sender + " " + subject).match(/on\s+behalf\s+of\s+([A-Z][A-Za-z0-9&.\s]{1,24}?)(?:\s*<|\s*[-–—:|!]|\s+for|$)/i);
  if (onBehalfMatch && onBehalfMatch[1]) {
    const clean = onBehalfMatch[1].trim().replace(/\s+/g, " ");
    if (!isGenericWord(clean)) return clean;
  }

  // 3. Check subject patterns
  const patterns = [
    /(?:Invitation\s+to\s+Interview:\s*)([A-Z][A-Za-z0-9&.\s]{1,20}?)(?:\s+Team|\s+Autopilot|$)/i,
    /(?:at|with|to)\s+([A-Z][A-Za-z0-9&.\s]{1,24}?)(?:\s+for|\s+as|\s*[-–—:|!])/i,
    /(?:your\s+application\s+to\s+)([A-Z][A-Za-z0-9&.\s]{1,24}?)(?:\s*[-–—:|!]|\s+for|$)/i,
    /[-–—:]\s*([A-Z][A-Za-z0-9&.\s]{1,20}?)\s+(?:Autopilot|Design|Software|Engineering|Product|Team)/i,
    /^([A-Z][A-Za-z0-9&.\s]{1,20}?)\s+(?:Technical|Coding|Assessment|Interview|Application|General|Offer|Talent|People|HR|Recruiting)/i,
    /([A-Z][A-Za-z0-9&.\s]{1,20}?)\s+(?:careers|jobs|team|recruiting|hiring)/i,
    /from\s+([A-Z][A-Za-z0-9&.\s]{1,20}?)\s+(?:team|talent)/i,
  ];

  for (const p of patterns) {
    const match = subject.match(p);
    if (match && match[1] && match[1].trim().length > 1) {
      const clean = match[1].trim().replace(/\s+/g, " ");
      if (!isGenericWord(clean)) return clean;
    }
  }

  return "Unknown Company";
}

function extractRole(message: NormalizedEmailMessage): string {
  const text = `${message.subject} ${message.snippet}`;

  const rolePatterns = [
    /(?:role\s+of|role:\s*|position\s+of|position:\s*|for\s+the\s+position\s+of\s+|for\s+the\s+role\s+of\s+)([^,.;–—|\n]{3,40})/i,
    /(?:application\s+for\s+)([^,.;–—|\n]{3,40})/i,
    /(Senior|Staff|Principal|Lead|Junior|Associate)?\s*(Software Engineer|Frontend Engineer|Backend Engineer|Full Stack Engineer|DevOps Engineer|Engineering Manager|Product Manager|Data Scientist|Mobile Engineer|iOS Engineer|Android Engineer|Cloud Engineer)/i,
  ];

  for (const p of rolePatterns) {
    const match = text.match(p);
    if (match && match[1]) {
      const rawRole = match[0].replace(/^(for|the|role|of|position|application|:)\s+/gi, "").trim();
      if (rawRole.length > 2 && !isGenericWord(rawRole)) {
        return rawRole.slice(0, 45).trim();
      }
    }
  }

  return "Software Engineer";
}

function isGenericWord(word: string): boolean {
  const lower = word.toLowerCase().trim();
  const generics = [
    "career",
    "careers",
    "jobs",
    "job",
    "talent",
    "recruiting",
    "recruitment",
    "team",
    "application",
    "update",
    "hr",
    "status",
    "hiring",
    "interview",
    "interviews",
    "invitation",
    "schedule",
    "scheduling",
  ];
  return generics.includes(lower);
}
