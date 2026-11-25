import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { companiesMatch, nextStage, pickApplication, rolesSimilar } from "./matching";

describe("companiesMatch", () => {
  it("ignores legal suffixes, case and punctuation", () => {
    assert.ok(companiesMatch("Stripe", "Stripe, Inc."));
    assert.ok(companiesMatch("stripe", "STRIPE LLC"));
  });
  it("matches whole leading words", () => {
    assert.ok(companiesMatch("Meta", "Meta Platforms"));
    assert.ok(companiesMatch("Goldman Sachs", "Goldman Sachs & Co."));
  });
  it("treats spacing variants as the same company", () => {
    assert.ok(companiesMatch("DoorDash", "Door Dash"));
  });
  it("doesn't match on a partial word", () => {
    assert.ok(!companiesMatch("Meta", "Metabase"));
    assert.ok(!companiesMatch("Ramp", "Rampart"));
  });
  it("doesn't match different companies sharing a later word", () => {
    assert.ok(!companiesMatch("Bank of America", "Bank of Montreal"));
    assert.ok(!companiesMatch("Apple", "Pineapple Labs"));
  });
});

describe("rolesSimilar", () => {
  it("matches seniority and abbreviation variants", () => {
    assert.ok(rolesSimilar("Sr. SWE", "Senior Software Engineer"));
    assert.ok(rolesSimilar("Software Engineer", "Software Engineer, Payments"));
    assert.ok(rolesSimilar("Backend Engineer", "Software Engineer, Backend"));
  });
  it("tells different roles apart", () => {
    assert.ok(!rolesSimilar("Software Engineer", "Product Manager"));
    assert.ok(!rolesSimilar("Data Analyst", "Data Scientist"));
  });
});

const apps = [
  { id: "stripe-be", company: "Stripe", role: "Backend Engineer", stage: "Applied" },
  { id: "stripe-pm", company: "Stripe", role: "Product Manager", stage: "Interviewing" },
  { id: "meta", company: "Meta", role: "Production Engineer", stage: "Applied" },
  { id: "acme-old", company: "Acme", role: "Data Analyst", stage: "Rejected" },
  { id: "acme-new", company: "Acme", role: "Data Engineer", stage: "Assessment" },
];

describe("pickApplication", () => {
  it("matches an update to the only application at that company", () => {
    const r = pickApplication(apps, "Meta Platforms", null, "rejection");
    assert.deepEqual(r, { kind: "match", application: apps[2] });
  });
  it("doesn't match a similar-looking company", () => {
    assert.deepEqual(pickApplication(apps, "Metabase", "Production Engineer", "rejection"), { kind: "none" });
  });
  it("uses the role to choose between applications at one company", () => {
    const r = pickApplication(apps, "Stripe", "Product Manager", "interview_invite");
    assert.deepEqual(r, { kind: "match", application: apps[1] });
  });
  it("is ambiguous when several applications fit and the role doesn't say which", () => {
    const r = pickApplication(apps, "Stripe", null, "rejection");
    assert.equal(r.kind, "ambiguous");
  });
  it("prefers the one open application over closed ones", () => {
    const r = pickApplication(apps, "Acme", null, "interview_invite");
    assert.deepEqual(r, { kind: "match", application: apps[4] });
  });
  it("treats a confirmation for a new role at a known company as a new application", () => {
    assert.deepEqual(pickApplication(apps, "Stripe", "Data Scientist", "application_confirmation"), { kind: "none" });
  });
  it("links a repeat confirmation for the same role instead of duplicating it", () => {
    const r = pickApplication(apps, "Stripe", "Senior Backend Engineer", "application_confirmation");
    assert.deepEqual(r, { kind: "match", application: apps[0] });
  });
  it("needs a company", () => {
    assert.deepEqual(pickApplication(apps, null, "Backend Engineer", "rejection"), { kind: "none" });
  });
});

describe("nextStage", () => {
  it("moves forward", () => {
    assert.equal(nextStage("Applied", "assessment_invite"), "Assessment");
    assert.equal(nextStage("Assessment", "interview_invite"), "Interviewing");
    assert.equal(nextStage("Interviewing", "offer"), "Offer");
    assert.equal(nextStage("Interviewing", "rejection"), "Rejected");
  });
  it("never moves backward", () => {
    assert.equal(nextStage("Interviewing", "recruiter_outreach"), null);
    assert.equal(nextStage("Assessment", "application_confirmation"), null);
  });
  it("leaves closed applications closed", () => {
    assert.equal(nextStage("Rejected", "interview_invite"), null);
    assert.equal(nextStage("Offer", "rejection"), null);
  });
  it("revives a ghosted application", () => {
    assert.equal(nextStage("Ghosted", "interview_invite"), "Interviewing");
    assert.equal(nextStage("Ghosted", "rejection"), "Rejected");
  });
  it("ignores a repeat of the current stage", () => {
    assert.equal(nextStage("Interviewing", "interview_invite"), null);
  });
});
