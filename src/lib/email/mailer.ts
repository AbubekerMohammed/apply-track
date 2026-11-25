/**
 * Transactional email delivery via Resend's HTTP API.
 * Requires RESEND_API_KEY and EMAIL_FROM (e.g. "Traill <digest@yourdomain.com>").
 */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!isMailerConfigured()) {
    throw new Error("Email delivery is not configured");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email provider rejected the message (${res.status}) ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as { id: string };
}
