import { NormalizedEmailMessage } from "./email-provider";
import { getValidAccessToken, MailAuthError, MailProvider } from "./oauth";

// Caps per sync. A 90-day first sync of an active job search fits well within these.
const GMAIL_MAX_MESSAGES = 500;
const OUTLOOK_MAX_MESSAGES = 1000;

// Narrow Gmail results to likely job-search mail so we don't read the whole inbox.
const GMAIL_KEYWORD_QUERY = [
  "{",
  '"thank you for applying"',
  '"thanks for applying"',
  '"your application"',
  '"thank you for your interest"',
  '"next steps"',
  "application",
  "applied",
  "interview",
  "assessment",
  "recruiter",
  "offer",
  "candidate",
  "position",
  "unfortunately",
  "hackerrank",
  "codesignal",
  "codility",
  "hirevue",
  "greenhouse",
  "lever",
  "workday",
  "ashby",
  "icims",
  "smartrecruiters",
  "jobvite",
  "}",
  "-category:promotions",
].join(" ");

// LinkedIn Easy Apply and Indeed confirmations often land in the Social or
// Promotions tabs, so they get their own query.
const GMAIL_JOB_BOARD_QUERY = "from:(jobs-noreply@linkedin.com OR indeed.com OR indeedemail.com)";

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

async function listGmailIds(accessToken: string, query: string, limit: number) {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const list = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    list.searchParams.set("q", query);
    list.searchParams.set("maxResults", String(Math.min(500, limit - ids.length)));
    if (pageToken) list.searchParams.set("pageToken", pageToken);
    const page = await getJson(list.toString(), accessToken);
    for (const m of page.messages ?? []) ids.push(m.id);
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < limit);
  return ids;
}

async function fetchGmail(
  userId: string,
  daysBack: number,
  skipIds: Set<string>
): Promise<NormalizedEmailMessage[]> {
  const { accessToken } = await getValidAccessToken(userId, "gmail");
  const window = `newer_than:${daysBack}d`;
  const [keywordIds, boardIds] = await Promise.all([
    listGmailIds(accessToken, `${window} ${GMAIL_KEYWORD_QUERY}`, GMAIL_MAX_MESSAGES),
    listGmailIds(accessToken, `${window} ${GMAIL_JOB_BOARD_QUERY}`, GMAIL_MAX_MESSAGES),
  ]);
  // Already-processed messages are skipped before fetching, so re-syncs stay fast.
  const ids = [...new Set([...keywordIds, ...boardIds])]
    .filter((id) => !skipIds.has(id))
    .slice(0, GMAIL_MAX_MESSAGES);

  const messages: NormalizedEmailMessage[] = [];
  // Small batches keep us well under Gmail's per-user rate limits.
  for (let i = 0; i < ids.length; i += 10) {
    const batch = await Promise.all(
      ids.slice(i, i + 10).map((id) => {
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

async function fetchOutlook(
  userId: string,
  daysBack: number,
  skipIds: Set<string>
): Promise<NormalizedEmailMessage[]> {
  const { accessToken } = await getValidAccessToken(userId, "outlook");
  const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString();

  const url = new URL("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages");
  url.searchParams.set("$filter", `receivedDateTime ge ${since}`);
  url.searchParams.set("$orderby", "receivedDateTime desc");
  url.searchParams.set("$select", "id,conversationId,receivedDateTime,from,subject,bodyPreview");
  url.searchParams.set("$top", "100");

  const messages: NormalizedEmailMessage[] = [];
  let scanned = 0;
  let next: string | undefined = url.toString();
  // Outlook can't keyword-filter alongside a date filter, so page through the
  // window (metadata only) and let the classifier discard unrelated mail.
  while (next && scanned < OUTLOOK_MAX_MESSAGES) {
    const page = await getJson(next, accessToken);
    for (const m of page.value ?? []) {
      scanned++;
      if (skipIds.has(m.id)) continue;
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

/**
 * Recent job-search mail from one connected inbox.
 * `skipIds` holds message IDs already processed, which aren't fetched again.
 */
export async function fetchRecentMessages(
  userId: string,
  provider: MailProvider,
  daysBack = 90,
  skipIds: Set<string> = new Set()
): Promise<NormalizedEmailMessage[]> {
  return provider === "gmail"
    ? fetchGmail(userId, daysBack, skipIds)
    : fetchOutlook(userId, daysBack, skipIds);
}
