import { NormalizedEmailMessage, ExtractedEmailData } from "./email-provider";

type Classification = ExtractedEmailData["classification"];

/**
 * Hiring platforms (applicant-tracking systems and assessment vendors) that
 * send mail on a company's behalf. Their domain never names the employer.
 * Keys are domain labels; values are display names.
 */
const HIRING_PLATFORMS: Record<string, string> = {
  greenhouse: "Greenhouse",
  "greenhouse-mail": "Greenhouse",
  lever: "Lever",
  workday: "Workday",
  myworkday: "Workday",
  myworkdayjobs: "Workday",
  ashbyhq: "Ashby",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  jobvite: "Jobvite",
  icims: "iCIMS",
  taleo: "Taleo",
  successfactors: "SuccessFactors",
  bamboohr: "BambooHR",
  workable: "Workable",
  workablemail: "Workable",
  recruitee: "Recruitee",
  breezy: "Breezy",
  breezyhr: "Breezy",
  jazzhr: "JazzHR",
  applytojob: "JazzHR",
  teamtailor: "Teamtailor",
  "teamtailor-mail": "Teamtailor",
  rippling: "Rippling",
  gem: "Gem",
  paradox: "Paradox",
  hackerrank: "HackerRank",
  hackerrankforwork: "HackerRank",
  codesignal: "CodeSignal",
  codility: "Codility",
  karat: "Karat",
  hirevue: "HireVue",
  testgorilla: "TestGorilla",
  coderbyte: "Coderbyte",
  codesubmit: "CodeSubmit",
};

/** Job boards: a source of applications, never the employer. */
const JOB_BOARDS: Record<string, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  indeedemail: "Indeed",
  glassdoor: "Glassdoor",
  ziprecruiter: "ZipRecruiter",
  monster: "Monster",
  dice: "Dice",
  joinhandshake: "Handshake",
  handshake: "Handshake",
  wellfound: "Wellfound",
  angellist: "Wellfound",
  builtin: "Built In",
  simplyhired: "SimplyHired",
  otta: "Otta",
  welcometothejungle: "Welcome to the Jungle",
};

/** Bulk-mail senders companies route mail through. */
const BULK_MAIL = new Set([
  "sendgrid",
  "mailchimp",
  "mcsv",
  "mandrillapp",
  "amazonses",
  "sparkpostmail",
  "ccsend",
  "hubspot",
  "hubspotemail",
  "mktomail",
  "marketo",
  "exacttarget",
  "pardot",
  "salesforce",
  "mailgun",
  "postmarkapp",
]);

const FREEMAIL = new Set([
  "gmail",
  "googlemail",
  "outlook",
  "hotmail",
  "live",
  "msn",
  "yahoo",
  "ymail",
  "icloud",
  "me",
  "mac",
  "aol",
  "proton",
  "protonmail",
  "gmx",
  "zoho",
  "fastmail",
]);

const ASSESSMENT_VENDORS = [
  "hackerrank",
  "codesignal",
  "codility",
  "karat",
  "hirevue",
  "testgorilla",
  "coderbyte",
  "codesubmit",
];

/** Words that can't be (or start) a company name. */
const COMPANY_STOPWORDS = new Set([
  "a", "an", "the", "your", "you", "our", "we", "us", "my", "this", "that", "it", "i",
  "thank", "thanks", "re", "fw", "fwd", "update", "updates", "application", "applications",
  "interview", "interviews", "next", "important", "action", "required", "reminder",
  "invitation", "congratulations", "hi", "hello", "dear", "new", "job", "jobs", "career",
  "careers", "talent", "recruiting", "recruitment", "hiring", "team", "hr", "people", "status",
  "position", "role", "offer", "assessment", "no", "noreply", "no-reply", "donotreply",
  "notification", "notifications", "info", "support", "admin", "mail", "email", "applicant",
  "candidate", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august", "september",
  "october", "november", "december", "today", "tomorrow", "pm", "am", "company", "example",
]);

/** Trailing words in a sender/team name that describe a department, not the company. */
const DEPARTMENT_WORDS =
  /\b(?:talent\s+acquisition|talent\s+team|hiring\s+team|recruiting\s+team|people\s+team|people\s+ops|careers?\s+team|recruiting|recruitment|recruiter|careers?|talent|hiring|jobs?|hr|people|team|university\s+programs|campus)\b/gi;

/** Words that trail a company name in subjects: "Acme Coding Assessment", "Acme Application Update". */
const TRAILING_DESCRIPTORS =
  /\s+(?:coding|technical|online|interviews?|assessments?|applications?|updates?|offer|invitation|invite|challenge|test|screen|process|status|confirmation|received|next|steps?|program)$/i;

const ROLE_NOUN =
  "(?:Engineer|Engineering|Developer|Designer|Manager|Analyst|Scientist|Researcher|Architect|Consultant|Specialist|Coordinator|Associate|Administrator|Intern|Internship|Co-op|Director|Lead|Technician|Representative|Recruiter|Accountant|Writer|Editor|Strategist|Officer|Advisor|Assistant|Producer|Programmer|Tester|Owner|Executive|Agent|Nurse|Teacher|Fellow|Fellowship|Apprentice|Operator|Marketer|Partner|President|Head|SRE|SDE|SWE|PM|TPM|QA)";
const ROLE_NOUN_RE = new RegExp(`\\b${ROLE_NOUN}s?\\b`, "i");

/** Titles that describe the sender (a recruiter's signature), not the job applied for. */
const SENDER_TITLES =
  /^(?:(?:senior|sr\.?|lead|technical|university|campus)\s+)?(?:recruiter|hiring manager|recruiting (?:coordinator|manager|partner|lead)|talent (?:acquisition )?(?:partner|specialist|manager|lead|coordinator|advisor)|people partner|hr (?:manager|partner|coordinator))$/i;

// One capitalized "word" of a company name: Stripe, Coca-Cola, Monday.com, AT&T, 23andMe, 3M.
const NAME_WORD = "(?:[A-Z](?:[\\w&'’\\-]|\\.(?=\\w))*|\\d+[A-Za-z](?:[\\w&'’\\-]|\\.(?=\\w))*)";
// Up to five such words, optionally joined by of/and/&/de: "Bank of America", "Johnson & Johnson".
const COMPANY = `(${NAME_WORD}(?:\\s+(?:(?:of|and|&|de|la|du)\\s+)?${NAME_WORD}){0,4})`;

/** Builds a case-insensitive pattern for literal keywords while keeping the company part case-sensitive. */
function ci(literal: string): string {
  return literal.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`);
}

// Patterns that name the employer explicitly. Tried on the subject, then the snippet.
const EXPLICIT_COMPANY_PATTERNS = [
  new RegExp(`${ci("application was sent to")}\\s+${COMPANY}`),
  new RegExp(`${ci("application has been submitted to")}\\s+${COMPANY}`),
  new RegExp(`${ci("submitted to")}\\s+${COMPANY}`),
  new RegExp(
    `\\b(?:${ci("applying")}|${ci("applied")}|${ci("application")}|${ci("apply")}|${ci("interest")}|${ci("interested")})\\s+(?:${ci("to")}|${ci("at")}|${ci("with")}|${ci("in")}|${ci("for")})\\s+${COMPANY}`
  ),
  new RegExp(`\\b${ci("joining")}\\s+${COMPANY}`),
  new RegExp(`\\b${ci("on behalf of")}\\s+${COMPANY}`),
];

// Looser patterns, used only after the sender gave no answer.
const LOOSE_SUBJECT_PATTERNS = [
  new RegExp(`\\b${ci("at")}\\s+${COMPANY}`),
  new RegExp(`\\b${ci("from")}\\s+${COMPANY}`),
  new RegExp(`^${COMPANY}\\s*[-–—|:]`),
  new RegExp(`[-–—|:]\\s*${COMPANY}\\s*[!.]?$`),
  new RegExp(
    `^${COMPANY}\\s+(?:${ci("application")}|${ci("interview")}|${ci("assessment")}|${ci("offer")}|${ci("careers")}|${ci("recruiting")}|${ci("talent")}|${ci("hiring")})\\b`
  ),
];

const LOOSE_SNIPPET_PATTERNS = [
  new RegExp(`\\b(?:${ci("role")}|${ci("position")}|${ci("opening")}|${ci("opportunity")}|${ci("team")}|${ci("job")})\\s+${ci("at")}\\s+${COMPANY}`),
  new RegExp(`\\b${ci("here at")}\\s+${COMPANY}`),
];

// Mail that mentions jobs but is never about an application you made.
const NOISE_SUBJECT =
  /\bjob alert|\bjobs? (?:for|matching|picked for) you|recommended (?:jobs?|for you)|\bnew jobs?\b|jobs? you (?:may|might)|\b(?:is|are) hiring\b|top job picks|similar jobs|jobs similar|people (?:also )?viewed|application (?:was |has been )?viewed|viewed your (?:application|profile)|\bapply now\b|newsletter|webinar|career fair|complete your (?:application|profile)|finish (?:your|applying)|continue your application|still interested in applying|saved jobs?|job recommendations?/i;
const NOISE_SENDER_LOCAL = /alert|digest|newsletter|marketing|news|promo/i;

interface ParsedSender {
  name: string;
  local: string;
  domain: string;
  /** Domain labels without the public suffix, e.g. us.greenhouse-mail.io -> ["us", "greenhouse-mail"]. */
  labels: string[];
  /** The registrable name, e.g. careers.stripe.com -> "stripe", talent.co.uk -> "talent". */
  root: string;
}

function parseSender(sender: string): ParsedSender {
  const angle = sender.match(/^\s*"?([^"<]*?)"?\s*<\s*([^>\s]+)\s*>\s*$/);
  const address = (angle ? angle[2] : sender).trim().toLowerCase();
  const name = angle ? angle[1].trim() : "";
  const at = address.lastIndexOf("@");
  const local = at > 0 ? address.slice(0, at) : "";
  const domain = at > 0 ? address.slice(at + 1) : "";

  const parts = domain.split(".").filter(Boolean);
  // Drop the TLD, plus a second-level suffix like co.uk or com.au.
  let cut = parts.length - 1;
  if (
    parts.length >= 3 &&
    parts[parts.length - 1].length === 2 &&
    ["co", "com", "org", "net", "ac", "gov", "edu", "ne", "or"].includes(parts[parts.length - 2])
  ) {
    cut = parts.length - 2;
  }
  const labels = parts.slice(0, Math.max(cut, 0));
  return { name, local, domain, labels, root: labels[labels.length - 1] ?? "" };
}

/** Which kind of sender this is, by its domain labels. */
function senderKind(s: ParsedSender): "platform" | "board" | "bulk" | "freemail" | "corporate" | "none" {
  if (!s.domain) return "none";
  if (s.labels.some((l) => l in HIRING_PLATFORMS)) return "platform";
  if (s.labels.some((l) => l in JOB_BOARDS)) return "board";
  if (s.labels.some((l) => BULK_MAIL.has(l))) return "bulk";
  if (FREEMAIL.has(s.root)) return "freemail";
  return "corporate";
}

function isPlatformOrBoardName(name: string): boolean {
  const squashed = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    Object.keys(HIRING_PLATFORMS).some((k) => k.replace(/-/g, "") === squashed) ||
    Object.values(HIRING_PLATFORMS).some((v) => v.toLowerCase().replace(/[^a-z0-9]/g, "") === squashed) ||
    Object.keys(JOB_BOARDS).includes(squashed) ||
    Object.values(JOB_BOARDS).some((v) => v.toLowerCase().replace(/[^a-z0-9]/g, "") === squashed)
  );
}

/** Tidies a candidate company name, or returns null if it isn't one. */
function cleanCompany(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let name = raw
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/'s$/i, "")
    .replace(/[.,!:;]+$/, "")
    .trim();

  // "Stripe via Greenhouse", "Acme Corp Recruiting", "Talent at Acme" -> the company part.
  name = name.replace(/\s+via\s+.*$/i, "").trim();
  const atMatch = name.match(/^(.*?\s)?at\s+(.+)$/i);
  if (atMatch && atMatch[1] && new RegExp(DEPARTMENT_WORDS.source, "i").test(atMatch[1])) {
    name = atMatch[2];
  }
  name = name.replace(DEPARTMENT_WORDS, " ").replace(/\s+/g, " ").trim();
  name = name.replace(/^[-–—|:&,\s]+|[-–—|:&,\s]+$/g, "").trim();
  // "Robinhood Coding Assessment" -> "Robinhood"
  let prev;
  do {
    prev = name;
    name = name.replace(TRAILING_DESCRIPTORS, "").trim();
  } while (name !== prev);

  if (name.length < 2 || name.length > 40) return null;
  const words = name.split(" ");
  if (words.length > 5) return null;
  if (COMPANY_STOPWORDS.has(words[0].toLowerCase())) return null;
  if (words.every((w) => COMPANY_STOPWORDS.has(w.toLowerCase()))) return null;
  if (isPlatformOrBoardName(name)) return null;
  if (ROLE_NOUN_RE.test(name)) return null; // "Backend Engineer" is a role, not a company
  if (/^(?:no[-_ ]?reply|do[-_ ]?not[-_ ]?reply|mailer[-_ ]daemon)$/i.test(name)) return null;
  if (/@/.test(name)) return null;
  return name;
}

function titleCase(label: string): string {
  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function firstMatch(patterns: RegExp[], text: string): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    const company = cleanCompany(m?.[1]);
    if (company) return company;
  }
  return null;
}

/** Company name from the sender address and display name. */
function companyFromSender(s: ParsedSender): string | null {
  const kind = senderKind(s);
  const displayName = cleanCompany(s.name);

  if (kind === "platform" || kind === "bulk") {
    // Workday: acme@myworkday.com, or acme.wd5.myworkdayjobs.com
    const workdayIdx = s.labels.findIndex((l) => l === "myworkday" || l === "myworkdayjobs");
    if (displayName) return displayName;
    if (workdayIdx >= 0) {
      const tenant = workdayIdx > 0 ? s.labels[0] : s.local;
      const fromTenant = cleanCompany(titleCase(tenant.replace(/\d+$/, "")));
      if (fromTenant && !/^(?:wd\d*|no[-_]?reply|donotreply)$/i.test(tenant)) return fromTenant;
    }
    return null;
  }

  if (kind === "corporate") {
    const root = s.root;
    if (!root || COMPANY_STOPWORDS.has(root) || root.length < 2) return displayName;
    // Prefer the display name's formatting when it is clearly the same company:
    // "Goldman Sachs Recruiting <x@goldmansachs.com>" -> "Goldman Sachs".
    if (displayName) {
      const squashed = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const initials = displayName
        .split(/\s+/)
        .map((w) => w[0]?.toLowerCase() ?? "")
        .join("");
      if (squashed === root.replace(/[^a-z0-9]/g, "") || squashed.startsWith(root) || initials === root) {
        return displayName;
      }
    }
    return cleanCompany(titleCase(root));
  }

  // Freemail and job boards: the display name is a person or the board itself.
  return null;
}

export function extractCompany(message: NormalizedEmailMessage): string | null {
  const subject = normalizeText(message.subject);
  const snippet = normalizeText(message.snippet);
  const sender = parseSender(message.sender);

  // Indeed: "Indeed Application: Data Analyst"; the employer is in the snippet.
  // LinkedIn: "Your application was sent to Notion".
  return (
    firstMatch(EXPLICIT_COMPANY_PATTERNS, subject) ??
    companyFromSender(sender) ??
    firstMatch(EXPLICIT_COMPANY_PATTERNS, snippet) ??
    firstMatch(LOOSE_SUBJECT_PATTERNS, subject) ??
    firstMatch(LOOSE_SNIPPET_PATTERNS, snippet)
  );
}

/** Tidies a candidate job title, or returns null if it isn't one. */
function cleanRole(raw: string | undefined | null, requireNoun = true): string | null {
  if (!raw) return null;
  const role = raw
    .replace(/[’]/g, "'")
    // Requisition IDs: (R12345), JR-1234, Req #123, ID: 4567, - 12345
    .replace(/\(?\b(?:R|JR|REQ|Req|req|ID|Job ID|Requisition)\s*[-#:]?\s*\d{3,}\b\)?/g, " ")
    .replace(/\(\s*\d+\s*\)/g, " ")
    .replace(/\s[-–—#]\s*\d{3,}\b/g, " ")
    .replace(/#\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // "Data Scientist has been received" -> "Data Scientist"
    .replace(/\s+(?:has|have|had|was|were|is|are|will|and we|we|you)\b.*$/i, "")
    .replace(/^(?:for|to|the|a|an|our|your|of)\s+/i, "")
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(/\s+(?:role|position|opening|opportunity|job|vacancy)$/i, "")
    .replace(/[\s.,;:!\-–—|()]+$/, "")
    .replace(/^[\s.,;:!\-–—|()]+/, "")
    .trim();

  if (role.length < 2 || role.length > 80) return null;
  if (role.split(" ").length > 10) return null;
  if (requireNoun && !ROLE_NOUN_RE.test(role)) return null;
  // Titles are either Title Case or all lowercase; a mix means a sentence was captured
  // ("Hey, reaching out about a Founding Engineer").
  const words = role.split(/[\s,/]+/).filter(Boolean);
  const connector = /^(?:of|and|for|in|to|the|&|-|–|\+|at|on)$/i;
  const hasCapital = words.some((w) => /^[A-Z0-9]/.test(w));
  const hasLower = words.some((w) => /^[a-z]/.test(w) && !connector.test(w));
  if (hasCapital && hasLower) return null;
  if (SENDER_TITLES.test(role)) return null;
  if (/^(?:position|role|job|application|opportunity)$/i.test(role)) return null;
  return role;
}

// Up to five capitalized words before a role noun: "Senior Software Engineer", "SWE Intern II".
const TITLE_RE = new RegExp(
  `(?:\\b(?:Senior|Sr\\.?|Staff|Principal|Lead|Junior|Jr\\.?|Associate|Entry[- ]Level|Mid[- ]Level|Head of|VP of|Vice President of|Director of)\\s+)?(?:\\b[A-Z][\\w/&+-]*\\s+){0,4}\\b${ROLE_NOUN}s?\\b(?:\\s+(?:I{1,3}|IV|V|[1-5]))?(?:,\\s+[A-Z][\\w&/+-]*(?:\\s+[A-Z][\\w&/+-]*){0,2})?`,
  "g"
);

export function extractRole(message: NormalizedEmailMessage): string | null {
  const subject = normalizeText(message.subject);
  const snippet = normalizeText(message.snippet);

  // Explicit formats where the title can be anything, even without a known noun.
  const explicit: RegExp[] = [
    /^Indeed Application:\s*(.+)$/i,
    /your application (?:to|for) (.+?) at [A-Z0-9]/i, // LinkedIn
    /\bapplication (?:was )?(?:sent|submitted) for (.+?) at [A-Z0-9]/i,
  ];
  for (const p of explicit) {
    const role = cleanRole(subject.match(p)?.[1], false) ?? cleanRole(snippet.match(p)?.[1], false);
    if (role) return role;
  }

  // Contextual: the title sits between known markers; it must contain a role noun.
  const contextual: RegExp[] = [
    /\b(?:for|to|in) the (.{3,80}?)\s+(?:role|position|opening|opportunity|job|vacancy)\b/i,
    /\b(?:position|role|job title|title)\s*(?:of|:|-)\s*(.{3,80}?)(?:[.;|!\n(]|\s+at\s|\s+with\s|\s+in\s|$)/i,
    /\b(?:application|applying|applied|apply)\s+(?:for|to)\s+(?:the\s+)?(?:position\s+of\s+)?(.{3,80}?)(?:\s+(?:role|position)\b|[.;|!\n(]|\s+at\s|\s+with\s|\s+here\b|$)/i,
    /\binterest in (?:the\s+)?(.{3,80}?)\s+(?:role|position|opening|opportunity)\b/i,
  ];
  // Subjects are often just "Role at Company" or "Role - Company".
  const subjectOnly: RegExp[] = [/^(.{3,80}?)\s+(?:at|@)\s+[A-Z0-9]/, /^(.{3,80}?)\s+[-–—|]\s/];
  for (const p of [...contextual, ...subjectOnly]) {
    const role = cleanRole(subject.match(p)?.[1]);
    if (role) return role;
  }
  for (const p of contextual) {
    const role = cleanRole(snippet.match(p)?.[1]);
    if (role) return role;
  }

  // Fallback: a capitalized job title anywhere in the subject, then the snippet.
  for (const text of [subject, snippet]) {
    for (const m of text.matchAll(TITLE_RE)) {
      const role = cleanRole(m[0]);
      if (role) return role;
    }
  }
  return null;
}

function normalizeText(text: string): string {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

const REJECTION_PHRASES = [
  "not moving forward",
  "not be moving forward",
  "won't be moving forward",
  "will not be proceeding",
  "not be proceeding",
  "decided not to proceed",
  "decided to proceed with other",
  "decided to move forward with other",
  "moving forward with other candidates",
  "move forward with other candidates",
  "pursue other candidates",
  "other candidates whose",
  "other applicants whose",
  "candidates whose experience more closely",
  "regret to inform",
  "unable to offer you",
  "have not been selected",
  "were not selected",
  "was not selected",
  "not been selected",
  "not selected for",
  "position has been filled",
  "role has been filled",
  "no longer considering",
  "no longer being considered",
  "go in a different direction",
  "move in a different direction",
  "unfortunately, we have decided",
  "unfortunately we have decided",
  "unfortunately, we've decided",
  "unfortunately, we will not",
  "unfortunately, we won't",
  "unfortunately, we are not able to move",
  "unfortunately, we are unable to move",
  "unfortunately, after",
  "unfortunately, the position",
  "unfortunately, the role",
  "unfortunately, this time",
  "not to move forward with your",
];
const SOFT_REJECTION_PHRASES = [
  "after careful consideration",
  "wish you the best in your job search",
  "wishing you the best in your job search",
  "best of luck in your job search",
  "best of luck in your search",
  "success in your job search",
];
const OFFER_PHRASES = [
  "offer letter",
  "offer of employment",
  "pleased to offer",
  "excited to offer",
  "happy to offer",
  "delighted to offer",
  "thrilled to offer",
  "extend an offer",
  "extend you an offer",
  "extending an offer",
  "verbal offer",
  "your offer from",
  "congratulations on your offer",
];
const ASSESSMENT_PHRASES = [
  "online assessment",
  "coding challenge",
  "coding assessment",
  "coding exercise",
  "technical assessment",
  "technical challenge",
  "skills assessment",
  "coding test",
  "technical test",
  "online test",
  "assessment link",
  "take-home",
  "take home assignment",
  "take home exercise",
  "complete your assessment",
  "complete the assessment",
  "complete an assessment",
  "assessment invitation",
  "invitation to complete",
  "invited to complete",
];
const INTERVIEW_PHRASES = [
  "invitation to interview",
  "invite you to interview",
  "invite you for an interview",
  "invite you to an interview",
  "schedule your interview",
  "schedule an interview",
  "schedule a interview",
  "interview invitation",
  "interview request",
  "interview confirmation",
  "interview scheduled",
  "interview has been scheduled",
  "technical interview",
  "next round",
  "final round",
  "onsite interview",
  "on-site interview",
  "virtual onsite",
  "phone interview",
  "video interview",
  "panel interview",
  "hiring manager interview",
  "like to move forward with your application",
  "move you forward",
  "next steps in the interview process",
  "next stage of the interview",
];
const RECRUITER_PHRASES = [
  "recruiter screen",
  "recruiter call",
  "phone screen",
  "introductory call",
  "introductory chat",
  "intro call",
  "quick chat",
  "quick call",
  "speak with a member of our talent team",
  "impressed by your background",
  "impressed by your profile",
  "came across your profile",
  "wanted to reach out regarding a role",
  "reaching out about a role",
];
// Only count as recruiter outreach when the email is also about a job.
const WEAK_RECRUITER_PHRASES = ["quick chat", "quick call", "15-minute", "15 minute", "30-minute", "set up a call", "schedule a call", "reaching out"];
const JOB_CONTEXT = /\b(?:role|position|opportunity|opening|job|candidacy|application)\b/;

// Confirmation emails describe later steps conditionally ("if selected, we'll
// schedule an interview"). When a confirmation phrase is present, an interview
// or assessment counts only with wording that actually invites you.
const ACTUAL_INTERVIEW_INVITE =
  /(?:would|'d) like to (?:invite|schedule|set up|move forward|speak)|invit(?:e|ing) you to (?:an? )?(?:interview|speak|meet|chat)|invitation to interview|interview invitation|please (?:schedule|select|choose|book|pick|use the link|let us know your availability|share your availability|provide your availability)|calendly|goodtime\.io|select a time|book a time|your interview (?:is|has been) (?:scheduled|confirmed)/;
const ACTUAL_ASSESSMENT_INVITE =
  /please complete|invit(?:e|ed|ing) you to (?:complete|take)|has invited you|you(?:'ve| have) been invited|link below|within \d+ (?:days|hours)|deadline|expires? (?:on|in)/;
const CONFIRMATION_PHRASES = [
  "thank you for applying",
  "thanks for applying",
  "thank you for your application",
  "thanks for your application",
  "thank you for submitting your application",
  "application received",
  "received your application",
  "application has been received",
  "application has been submitted",
  "application was submitted",
  "application submitted",
  "successfully submitted",
  "successfully applied",
  "your application was sent",
  "application was sent to",
  "we have your application",
  "application confirmation",
  "confirming your application",
  "indeed application:",
];
const WEAK_CONFIRMATION_PHRASES = ["thank you for your interest in", "thanks for your interest in"];

function classify(subject: string, text: string, sender: ParsedSender): { classification: Classification; confidence: number } {
  if (NOISE_SUBJECT.test(subject) || NOISE_SENDER_LOCAL.test(sender.local)) {
    return { classification: "other", confidence: 0.9 };
  }

  const subj = subject.toLowerCase();

  // Rejections first: they often repeat confirmation or interview wording
  // ("thank you for your interest... unfortunately").
  if (includesAny(text, REJECTION_PHRASES)) return { classification: "rejection", confidence: 0.92 };
  if (includesAny(text, SOFT_REJECTION_PHRASES)) return { classification: "rejection", confidence: 0.85 };

  if (
    includesAny(text, OFFER_PHRASES) ||
    (/\boffer\b/.test(subj) && /compensation|start date|welcome to the team|salary/.test(text))
  ) {
    return { classification: "offer", confidence: 0.93 };
  }

  const confirmation = includesAny(text, CONFIRMATION_PHRASES);

  const vendor = ASSESSMENT_VENDORS.some((v) => text.includes(v) || sender.labels.some((l) => l.startsWith(v)));
  if (
    (vendor && (!confirmation || ACTUAL_ASSESSMENT_INVITE.test(text))) ||
    (includesAny(text, ASSESSMENT_PHRASES) && (!confirmation || ACTUAL_ASSESSMENT_INVITE.test(text)))
  ) {
    return { classification: "assessment_invite", confidence: vendor ? 0.95 : 0.88 };
  }

  const interview =
    includesAny(text, INTERVIEW_PHRASES) ||
    (/\binterview\b/.test(text) && /availability|schedule|calendly|time slot|invite/.test(text));
  if (interview && (!confirmation || ACTUAL_INTERVIEW_INVITE.test(text))) {
    return { classification: "interview_invite", confidence: 0.88 };
  }

  if (
    !confirmation &&
    (includesAny(text, RECRUITER_PHRASES) || (includesAny(text, WEAK_RECRUITER_PHRASES) && JOB_CONTEXT.test(text)))
  ) {
    return { classification: "recruiter_outreach", confidence: 0.85 };
  }

  if (confirmation) {
    return { classification: "application_confirmation", confidence: 0.93 };
  }
  // "Thank you for your interest in Acme" alone is also used by newsletters and talent communities.
  if (includesAny(text, WEAK_CONFIRMATION_PHRASES)) {
    return { classification: "application_confirmation", confidence: 0.7 };
  }

  return { classification: "other", confidence: 0.5 };
}

function detectPlatform(text: string, sender: ParsedSender): string | undefined {
  for (const label of sender.labels) {
    if (label in HIRING_PLATFORMS) return HIRING_PLATFORMS[label];
    if (label in JOB_BOARDS) return JOB_BOARDS[label];
  }
  for (const [key, name] of Object.entries({ ...HIRING_PLATFORMS })) {
    if (key.length > 4 && text.includes(key)) return name;
  }
  return undefined;
}

/**
 * Classifies one job-search email and extracts the company and role.
 *
 * Company or role come back as null when they can't be determined; the email
 * is then flagged for review rather than filed under a guess.
 */
export async function classifyEmail(message: NormalizedEmailMessage): Promise<ExtractedEmailData> {
  const subject = normalizeText(message.subject);
  const text = `${subject} ${normalizeText(message.snippet)}`.toLowerCase();
  const sender = parseSender(message.sender);

  const { classification, confidence } = classify(subject, text, sender);
  const company = classification === "other" ? null : extractCompany(message);
  const role = classification === "other" ? null : extractRole(message);

  // Creating an application needs both company and role; moving an existing
  // one along only needs the company (the role is used to tell apart several
  // applications at the same company).
  const needsReview =
    classification === "other" ||
    confidence < 0.75 ||
    !company ||
    (classification === "application_confirmation" && !role);

  return {
    company,
    role,
    date: message.date,
    classification,
    confidence: needsReview ? Math.min(confidence, 0.65) : confidence,
    needsReview,
    platform: detectPlatform(text, sender),
  };
}
