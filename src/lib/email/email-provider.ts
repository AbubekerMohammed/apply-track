/**
 * Shared Email Provider Interface for ApplyTrack (Gmail & Outlook)
 */

export interface NormalizedEmailMessage {
  messageId: string;
  threadId?: string;
  date: Date;
  sender: string;
  subject: string;
  snippet: string;
  provider: "gmail" | "outlook";
}

export interface ExtractedEmailData {
  company: string;
  role: string;
  date: Date;
  classification:
    | "application_confirmation"
    | "rejection"
    | "assessment_invite"
    | "recruiter_outreach"
    | "interview_invite"
    | "offer"
    | "other";
  confidence: number; // 0.0 to 1.0
  needsReview: boolean;
  platform?: string; // e.g. HackerRank, CodeSignal, Greenhouse, Lever
}

export interface EmailProvider {
  name: "gmail" | "outlook";
  fetchEmails(userId: string, daysBack?: number): Promise<NormalizedEmailMessage[]>;
}
