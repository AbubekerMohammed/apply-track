import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyEmail } from "./classifier";
import type { ExtractedEmailData } from "./email-provider";

interface Case {
  name: string;
  sender: string;
  subject: string;
  snippet: string;
  expect: {
    classification: ExtractedEmailData["classification"];
    company?: string | null;
    role?: string | null;
    needsReview?: boolean;
    platform?: string;
  };
}

function run(c: Case) {
  return classifyEmail({
    provider: "gmail",
    messageId: "test",
    date: new Date("2026-11-01T12:00:00Z"),
    sender: c.sender,
    subject: c.subject,
    snippet: c.snippet,
  });
}

function check(cases: Case[]) {
  for (const c of cases) {
    it(c.name, async () => {
      const r = await run(c);
      assert.equal(r.classification, c.expect.classification, "classification");
      if (c.expect.company !== undefined) assert.equal(r.company, c.expect.company, "company");
      if (c.expect.role !== undefined) assert.equal(r.role, c.expect.role, "role");
      if (c.expect.needsReview !== undefined) assert.equal(r.needsReview, c.expect.needsReview, "needsReview");
      if (c.expect.platform !== undefined) assert.equal(r.platform, c.expect.platform, "platform");
    });
  }
}

describe("hiring-platform senders name the employer, not the platform", () => {
  check([
    {
      name: "Greenhouse: company from subject, role with team suffix",
      sender: "Stripe <no-reply@us.greenhouse-mail.io>",
      subject: "Thank you for applying to Stripe",
      snippet:
        "Hi Abu, thanks for applying to the Backend Engineer, Payments role at Stripe. We have received your application",
      expect: {
        classification: "application_confirmation",
        company: "Stripe",
        role: "Backend Engineer, Payments",
        needsReview: false,
        platform: "Greenhouse",
      },
    },
    {
      name: "Workday: company from display name, requisition ID stripped",
      sender: "Acme Corp <acme@myworkday.com>",
      subject: "Thank you for your application",
      snippet: "We have received your application for Data Analyst (R12345).",
      expect: { classification: "application_confirmation", company: "Acme Corp", role: "Data Analyst", platform: "Workday" },
    },
    {
      name: "Workday: company from the sender address when there's no display name",
      sender: "acme@myworkday.com",
      subject: "Thank you for your application",
      snippet: "We have received your application for Data Analyst (R12345).",
      expect: { classification: "application_confirmation", company: "Acme", role: "Data Analyst" },
    },
    {
      name: "Workday: trailing 'has been received' and dash ID removed from role",
      sender: "Uber <uber@myworkday.com>",
      subject: "Uber - Application Received",
      snippet:
        "Thank you for your interest in Uber. Your application for Senior Data Scientist - 12345 has been received.",
      expect: { classification: "application_confirmation", company: "Uber", role: "Senior Data Scientist" },
    },
    {
      name: "Workday: leading 'The' display name falls back to the tenant",
      sender: "The Walt Disney Company <disney@myworkday.com>",
      subject: "Thank you for applying",
      snippet: "Thank you for applying for the Associate Product Manager role.",
      expect: { classification: "application_confirmation", company: "Disney", role: "Associate Product Manager" },
    },
    {
      name: "Ashby",
      sender: "Ramp <no-reply@ashbyhq.com>",
      subject: "Thanks for applying to Ramp!",
      snippet: "Thanks for applying for the Product Designer position.",
      expect: { classification: "application_confirmation", company: "Ramp", role: "Product Designer", platform: "Ashby" },
    },
    {
      name: "Lever: company from 'Company - Next steps' subject",
      sender: "Datadog <noreply@hire.lever.co>",
      subject: "Datadog - Next steps",
      snippet:
        "We'd like to invite you to complete a HackerRank online assessment for the Software Engineer position",
      expect: { classification: "assessment_invite", company: "Datadog", role: "Software Engineer" },
    },
  ]);
});

describe("job boards", () => {
  check([
    {
      name: "LinkedIn Easy Apply confirmation",
      sender: "LinkedIn <jobs-noreply@linkedin.com>",
      subject: "Abubeker, your application was sent to Notion",
      snippet: "Your application was sent to Notion. Marketing Manager Notion · San Francisco, CA (Hybrid)",
      expect: {
        classification: "application_confirmation",
        company: "Notion",
        role: "Marketing Manager",
        needsReview: false,
        platform: "LinkedIn",
      },
    },
    {
      name: "LinkedIn application update (rejection)",
      sender: "LinkedIn <jobs-noreply@linkedin.com>",
      subject: "Your application to Senior Product Manager at Figma",
      snippet:
        "Thanks for your interest in the role. Unfortunately, we have decided to move forward with other candidates.",
      expect: { classification: "rejection", company: "Figma", role: "Senior Product Manager" },
    },
    {
      name: "Indeed Apply confirmation",
      sender: "Indeed <indeedapply@indeed.com>",
      subject: "Indeed Application: Customer Success Specialist",
      snippet: "Your application has been submitted to Zendesk. Good luck!",
      expect: {
        classification: "application_confirmation",
        company: "Zendesk",
        role: "Customer Success Specialist",
        platform: "Indeed",
      },
    },
  ]);
});

describe("company sender domains", () => {
  check([
    {
      name: "a recruiter's personal name isn't the company; the domain is",
      sender: "Jane Smith <jane.smith@stripe.com>",
      subject: "Interview availability",
      snippet:
        "Hi Abu, we'd love to schedule your interview for the Software Engineer role. Please share your availability.",
      expect: { classification: "interview_invite", company: "Stripe", role: "Software Engineer" },
    },
    {
      name: "short domain matched to display-name initials (gs.com -> Goldman Sachs)",
      sender: "Goldman Sachs Recruiting <recruiting@gs.com>",
      subject: "Your application",
      snippet: "Thank you for applying to the 2027 Summer Analyst Program at Goldman Sachs.",
      expect: { classification: "application_confirmation", company: "Goldman Sachs" },
    },
    {
      name: "department words removed from display name",
      sender: "Netflix Recruiting <talent@netflix.com>",
      subject: "Update on your application",
      snippet:
        "Unfortunately, we have decided to move forward with other candidates for the Senior UX Researcher role.",
      expect: { classification: "rejection", company: "Netflix", role: "Senior UX Researcher" },
    },
    {
      name: "'Talent Acquisition at Meta' -> Meta",
      sender: "Talent Acquisition at Meta <noreply@meta.com>",
      subject: "Thank you for applying to Meta",
      snippet: "We have received your application for Production Engineer.",
      expect: { classification: "application_confirmation", company: "Meta", role: "Production Engineer" },
    },
    {
      name: "multi-word company with 'of'",
      sender: "Bank of America <noreply@bankofamerica.com>",
      subject: "Thanks for applying",
      snippet: "Thank you for your application for the Software Engineer II position.",
      expect: { classification: "application_confirmation", company: "Bank of America", role: "Software Engineer II" },
    },
    {
      name: "careers address",
      sender: "Shopify Careers <careers@shopify.com>",
      subject: "We received your application!",
      snippet: "Thanks for applying to the Staff Developer position.",
      expect: { classification: "application_confirmation", company: "Shopify", role: "Staff Developer" },
    },
  ]);
});

describe("unknown company or role goes to review instead of a guess", () => {
  check([
    {
      name: "generic sender, no company anywhere",
      sender: "jobs@talent.co.uk",
      subject: "Application received",
      snippet: "Thank you for applying. We received your application.",
      expect: { classification: "application_confirmation", company: null, role: null, needsReview: true },
    },
    {
      name: "no role in a confirmation",
      sender: "recruiting@company.com",
      subject: "Your application",
      snippet: "Thanks for applying to our team",
      expect: { classification: "application_confirmation", role: null, needsReview: true },
    },
    {
      name: "'thank you for your interest' alone is weak (talent communities)",
      sender: "Monzo <hello@monzo.com>",
      subject: "Thank you for your interest in Monzo",
      snippet: "Join our talent community to hear about new roles.",
      expect: { classification: "application_confirmation", company: "Monzo", needsReview: true },
    },
  ]);
});

describe("stage classification", () => {
  check([
    {
      name: "offer",
      sender: "Airbnb <careers-noreply@airbnb.com>",
      subject: "Congratulations! Your offer from Airbnb",
      snippet: "We're thrilled to offer you the position of Software Engineer. Your offer letter is attached.",
      expect: { classification: "offer", company: "Airbnb", role: "Software Engineer" },
    },
    {
      name: "interview invite via Greenhouse",
      sender: "Coinbase <no-reply@greenhouse.io>",
      subject: "Interview Invitation: Coinbase",
      snippet:
        "We'd like to invite you to interview for the Software Engineer, Platform role. Please use the link to schedule.",
      expect: { classification: "interview_invite", company: "Coinbase", role: "Software Engineer, Platform" },
    },
    {
      name: "assessment: descriptor words stripped from company",
      sender: "no-reply@hackerrankforwork.com",
      subject: "Invitation: Robinhood Coding Assessment",
      snippet: "Robinhood has invited you to take the Software Engineer Intern assessment on HackerRank.",
      expect: { classification: "assessment_invite", company: "Robinhood", role: "Software Engineer Intern" },
    },
    {
      name: "assessment from a vendor subdomain",
      sender: "Duolingo <no-reply@hackerrankforwork.com>",
      subject: "Duolingo has invited you to a coding test",
      snippet: "Duolingo has invited you to take the Software Engineer assessment. The link expires in 7 days.",
      expect: { classification: "assessment_invite", company: "Duolingo" },
    },
    {
      name: "recruiter outreach",
      sender: "Kim from Vercel <kim@vercel.com>",
      subject: "Quick chat about a role at Vercel?",
      snippet:
        "Hi! I came across your profile and wanted to set up a quick call about our Senior Frontend Engineer opening.",
      expect: { classification: "recruiter_outreach", company: "Vercel", role: "Senior Frontend Engineer" },
    },
    {
      name: "recruiter outreach: role not taken from a sentence",
      sender: "Sam <sam@startup.io>",
      subject: "Quick call?",
      snippet: "Hey, reaching out about a Founding Engineer opportunity at Startup.",
      expect: { classification: "recruiter_outreach", role: "Founding Engineer" },
    },
    {
      name: "rejection after an interview isn't read as an interview",
      sender: "Snowflake <no-reply@hire.lever.co>",
      subject: "Your application to Snowflake",
      snippet:
        "Thank you for taking the time to interview with us. Unfortunately, we have decided not to move forward with your candidacy for the Data Engineer role.",
      expect: { classification: "rejection", company: "Snowflake", role: "Data Engineer" },
    },
  ]);
});

describe("confirmations that mention later steps stay confirmations", () => {
  check([
    {
      name: "'unable to respond to every applicant' and 'schedule an interview' if selected",
      sender: "Plaid <no-reply@us.greenhouse-mail.io>",
      subject: "Thank you for applying to Plaid",
      snippet:
        "We received your application for Software Engineer. If your background is a fit, a recruiter will reach out to schedule an interview. Unfortunately, we are unable to respond to every applicant.",
      expect: { classification: "application_confirmation", company: "Plaid", role: "Software Engineer" },
    },
    {
      name: "'you may be asked to complete an online assessment'",
      sender: "Pinterest <pinterest@myworkday.com>",
      subject: "Thank you for applying!",
      snippet:
        "Thank you for applying for Software Engineer, Ads. As a next step, you may be asked to complete an online assessment.",
      expect: { classification: "application_confirmation", company: "Pinterest", role: "Software Engineer, Ads" },
    },
    {
      name: "a real interview invite that also thanks you for applying",
      sender: "Figma <no-reply@ashbyhq.com>",
      subject: "Figma - Interview Invitation",
      snippet:
        "Thank you for applying! We'd like to invite you to interview for the Product Designer role. Please use the link to schedule.",
      expect: { classification: "interview_invite", company: "Figma", role: "Product Designer" },
    },
  ]);
});

describe("job-search noise is ignored", () => {
  check([
    {
      name: "LinkedIn job alert",
      sender: "LinkedIn Job Alerts <jobalerts-noreply@linkedin.com>",
      subject: "30+ new jobs for Software Engineer",
      snippet: "Stripe is hiring: Software Engineer",
      expect: { classification: "other" },
    },
    {
      name: "Indeed job alert",
      sender: "Indeed <alert@indeed.com>",
      subject: "Software Engineer jobs for you",
      snippet: "Apply now to Google",
      expect: { classification: "other" },
    },
    {
      name: "application viewed notification",
      sender: "Glassdoor <noreply@glassdoor.com>",
      subject: "Your application was viewed",
      snippet: "Acme viewed your application",
      expect: { classification: "other" },
    },
    {
      name: "unrelated email that mentions scheduling a call",
      sender: "Chase <alerts@chase.com>",
      subject: "Your statement is ready",
      snippet: "Your account statement is available. Schedule a call with an advisor.",
      expect: { classification: "other" },
    },
  ]);
});
