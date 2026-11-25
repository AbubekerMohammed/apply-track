import type { ExtractedEmailData } from "./email-provider";

type Classification = ExtractedEmailData["classification"];

export interface MatchableApplication {
  id: string;
  company: string;
  role: string;
  stage: string;
  updatedAt?: Date;
}

export type ApplicationPick<T extends MatchableApplication> =
  | { kind: "match"; application: T }
  | { kind: "none" }
  | { kind: "ambiguous"; candidates: T[] };

// Legal-entity and filler words that don't distinguish one company from another.
const COMPANY_FILLER = new Set([
  "inc", "incorporated", "llc", "llp", "ltd", "limited", "corp", "corporation", "co", "company",
  "plc", "gmbh", "ag", "sa", "bv", "nv", "pty", "pte", "technologies", "technology", "labs",
  "group", "holdings", "the", "hq", "and",
]);

/** "Stripe, Inc." -> ["stripe"], "Meta Platforms" -> ["meta", "platforms"]. */
function companyTokens(name: string): string[] {
  const tokens = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
  const meaningful = tokens.filter((t) => !COMPANY_FILLER.has(t));
  return meaningful.length ? meaningful : tokens;
}

/**
 * True when two company names refer to the same employer.
 *
 * Matches whole words only: "Meta" matches "Meta Platforms" but not
 * "Metabase", and "DoorDash" matches "Door Dash".
 */
export function companiesMatch(a: string, b: string): boolean {
  const ta = companyTokens(a);
  const tb = companyTokens(b);
  if (!ta.length || !tb.length) return false;
  if (ta.join("") === tb.join("")) return true;
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return shorter.every((t, i) => longer[i] === t);
}

const ROLE_FILLER = new Set([
  "the", "a", "an", "of", "and", "for", "role", "position", "job", "opening", "i", "ii", "iii",
  "iv", "1", "2", "3", "4", "remote", "hybrid", "onsite", "us", "usa", "new", "grad",
]);
const ROLE_ALIASES: Record<string, string> = {
  sr: "senior",
  jr: "junior",
  swe: "software engineer",
  sde: "software engineer",
  eng: "engineer",
  mgr: "manager",
  pm: "product manager",
  ml: "machine learning",
  ai: "artificial intelligence",
  ux: "user experience",
  ui: "user interface",
  fullstack: "full stack",
  frontend: "front end",
  backend: "back end",
};

function roleTokens(role: string): Set<string> {
  const expanded = role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((t) => ROLE_ALIASES[t] ?? t)
    .join(" ")
    .split(" ");
  return new Set(expanded.filter((t) => t && !ROLE_FILLER.has(t)));
}

/** True when two job titles are probably the same opening, e.g. "Sr. SWE" vs "Senior Software Engineer". */
export function rolesSimilar(a: string, b: string): boolean {
  const ta = roleTokens(a);
  const tb = roleTokens(b);
  if (!ta.size || !tb.size) return false;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  // Overlap relative to the shorter title, so "Software Engineer" matches
  // "Software Engineer, Payments" but not "Product Manager".
  return shared / Math.min(ta.size, tb.size) >= 0.75 && shared >= Math.min(2, ta.size, tb.size);
}

const CLOSED_STAGES = new Set(["Rejected", "Offer", "Withdrawn"]);

/**
 * Finds the one application an email is about.
 *
 * - Confirmations match only an application with a similar role; a new role at
 *   a known company is a new application ("none").
 * - Other updates match by company, using the role to choose between several
 *   applications at that company. If that still leaves more than one, the
 *   email is "ambiguous" and should be reviewed by hand.
 */
export function pickApplication<T extends MatchableApplication>(
  applications: T[],
  company: string | null,
  role: string | null,
  classification: Classification
): ApplicationPick<T> {
  if (!company) return { kind: "none" };
  const atCompany = applications.filter((app) => companiesMatch(app.company, company));
  if (!atCompany.length) return { kind: "none" };

  const sameRole = role ? atCompany.filter((app) => rolesSimilar(app.role, role)) : [];

  if (classification === "application_confirmation") {
    if (sameRole.length === 1) return { kind: "match", application: sameRole[0] };
    if (sameRole.length > 1) return { kind: "ambiguous", candidates: sameRole };
    return { kind: "none" };
  }

  if (sameRole.length === 1) return { kind: "match", application: sameRole[0] };
  const pool = sameRole.length > 1 ? sameRole : atCompany;
  if (pool.length === 1) return { kind: "match", application: pool[0] };

  // Several left: an update is almost always about the one still in progress.
  const open = pool.filter((app) => !CLOSED_STAGES.has(app.stage));
  if (open.length === 1) return { kind: "match", application: open[0] };
  return { kind: "ambiguous", candidates: pool };
}

export const STAGE_FOR_CLASSIFICATION: Partial<Record<Classification, string>> = {
  application_confirmation: "Applied",
  recruiter_outreach: "Recruiter Call",
  assessment_invite: "Assessment",
  interview_invite: "Interviewing",
  offer: "Offer",
  rejection: "Rejected",
};

const STAGE_RANK: Record<string, number> = {
  Ghosted: -1,
  Applied: 0,
  "Recruiter Call": 1,
  Assessment: 2,
  Interviewing: 3,
  Offer: 4,
  Rejected: 4,
};

/**
 * The stage an application should move to after this email, or null to leave it.
 *
 * Stages only move forward: a recruiter email arriving after an interview
 * invite doesn't pull the application back to "Recruiter Call", and closed
 * applications (Offer, Rejected) stay closed. Any new email revives a Ghosted one.
 */
export function nextStage(currentStage: string, classification: Classification): string | null {
  const target = STAGE_FOR_CLASSIFICATION[classification];
  if (!target || target === currentStage) return null;
  if (CLOSED_STAGES.has(currentStage)) return null;
  const current = STAGE_RANK[currentStage] ?? 0;
  return STAGE_RANK[target] > current ? target : null;
}
