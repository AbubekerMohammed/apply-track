import { NormalizedEmailMessage } from "./email-provider";
import { getValidAccessToken, MailAuthError, MailProvider } from "./oauth";

const MAX_MESSAGES = 100;

// Narrow Gmail results to likely job-search mail so we don't read the whole inbox.
const GMAIL_QUERY = [
  "{",
  '"thank you for applying"',
  '"your application"',
  "application",
  "applied",
  "interview",
  "assessment",
  "recruiter",
  "offer",
  "candidate",
  "position",
  "hackerrank",
  "codesignal",
  "greenhouse",
  "lever",
  "workday",
  "ashby",
  "}",
  "-category:promotions",
  "-category:social",
].join(" ");

async function getJson(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    throw new MailAuthError("Mailbox access was revoked or expired. Please reconnect.");
  }
  if (!res.ok) {
    throw new Error(`Mail API request failed (${res.status})`);
  }
  return res.json();
}

async function fetchGmail(userId: string, daysBack: number): Promise<NormalizedEmailMessage[]> {
  const { accessToken } = await getValidAccessToken(userId, "gmail");
  const list = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  list.searchParams.set("q", `newer_than:${daysBack}d ${GMAIL_QUERY}`);
  list.searchParams.set("maxResults", String(MAX_MESSAGES));

  const listing = await getJson(list.toString(), accessToken);
  const ids: Array<{ id: string }> = listing.messages ?? [];

  const messages: NormalizedEmailMessage[] = [];
  // Small batches keep us well under Gmail's per-user rate limits.
  for (let i = 0; i < ids.length; i += 10) {
    const batch = await Promise.all(
      ids.slice(i, i + 10).map(({ id }) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
        url.searchParams.set("format", "metadata");
        for (const h of ["Subject", "From", "Date"]) url.searchParams.append("metadataHeaders", h);
        return getJson(url.toString(), accessToken);
      })
    );

    for (const msg of batch) {
      const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
      const header = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
      messages.push({
        provider: "gmail",
        messageId: msg.id,
        threadId: msg.threadId,
        date: msg.internalDate ? new Date(Number(msg.internalDate)) : new Date(header("Date")),
        sender: header("From"),
        subject: header("Subject") || "(no subject)",
        snippet: decodeEntities(msg.snippet ?? ""),
      });
    }
  }
  return messages;
}

async function fetchOutlook(userId: string, daysBack: number): Promise<NormalizedEmailMessage[]> {
  const { accessToken } = await getValidAccessToken(userId, "outlook");
  const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString();

  const url = new URL("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages");
  url.searchParams.set("$filter", `receivedDateTime ge ${since}`);
  url.searchParams.set("$orderby", "receivedDateTime desc");
  url.searchParams.set("$select", "id,conversationId,receivedDateTime,from,subject,bodyPreview");
  url.searchParams.set("$top", "50");

  const messages: NormalizedEmailMessage[] = [];
  let next: string | undefined = url.toString();
  // Outlook can't keyword-filter alongside a date filter, so page through a capped window.
  while (next && messages.length < MAX_MESSAGES * 2) {
    const page = await getJson(next, accessToken);
    for (const m of page.value ?? []) {
      const from = m.from?.emailAddress;
      messages.push({
        provider: "outlook",
        messageId: m.id,
        threadId: m.conversationId,
        date: new Date(m.receivedDateTime),
        sender: from ? `${from.name ?? ""} <${from.address ?? ""}>`.trim() : "",
        subject: m.subject || "(no subject)",
        snippet: m.bodyPreview ?? "",
      });
    }
    next = page["@odata.nextLink"];
  }
  return messages;
}

function decodeEntities(text: string) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export async function fetchRecentMessages(
  userId: string,
  provider: MailProvider,
  daysBack = 90
): Promise<NormalizedEmailMessage[]> {
  return provider === "gmail" ? fetchGmail(userId, daysBack) : fetchOutlook(userId, daysBack);
}
