import "server-only";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Minimal Resend REST call via plain fetch, mirroring the callExternal()/
 * payments no-SDK style already used elsewhere. Returns a typed failure
 * (rather than throwing) when unconfigured, so callers can surface a clear
 * "not set up" message instead of a stack trace.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "PredictScore <onboarding@resend.dev>";
  if (!apiKey) {
    return {
      ok: false,
      error: "Email sending is not configured (missing RESEND_API_KEY)",
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Email provider error (${res.status}): ${body.slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to send email",
    };
  }
}
