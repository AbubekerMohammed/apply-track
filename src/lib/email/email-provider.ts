/**
 * Shared Email Provider Interface for Traill (Gmail & Outlook)
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
  /** Null when the employer couldn't be determined. */
  company: string | null;
  /** Null when the job title couldn't be determined. */
  role: string | null;
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
