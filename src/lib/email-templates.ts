import "server-only";

const NAVY = "#0d1424";
const NAVY_TEXT = "#111a2e";
const LIME = "#b6f31c";
const MUTED = "#5b6478";
const BORDER = "#e6e8ee";
const PAGE_BG = "#f2f3f6";
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Table-based, inline-styled email shell (no external stylesheets/flexbox) so it
 * renders consistently across Gmail, Outlook, and Apple Mail. `bgcolor` attributes
 * are set alongside CSS background so client-side dark-mode re-coloring (Gmail
 * Android, Outlook.com) doesn't flip sections to unreadable combinations.
 */
function emailShell(args: { title: string; preheader: string; appUrl: string; bodyHtml: string }): string {
  const { title, preheader, appUrl, bodyHtml } = args;
  const logoUrl = `${appUrl}/brand/shuzam-mark-512.png`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT_STACK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" style="background:${PAGE_BG};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td align="center" bgcolor="${NAVY}" style="background:${NAVY};padding:32px 24px;">
                <img
                  src="${logoUrl}"
                  width="36"
                  height="36"
                  alt="SHUZAM"
                  style="display:block;margin:0 auto 12px;"
                />
                <span style="font-family:${FONT_STACK};font-size:20px;font-weight:700;letter-spacing:0.04em;color:#f3f5fa;">
                  SHUZAM
                </span>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 32px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:24px 16px 0;">
                <p style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:#9aa2b4;">
                  SHUZAM® is a product of Ledobiz Technologies Limited. Not a bookmaker or
                  gambling operator — it does not accept or facilitate wagers.
                </p>
                <p style="margin:8px 0 0;font-family:${FONT_STACK};font-size:12px;color:#9aa2b4;">
                  © ${new Date().getFullYear()} Ledobiz Technologies Limited. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" bgcolor="${LIME}" style="background:${LIME};border-radius:10px;">
          <a
            href="${href}"
            style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:${NAVY_TEXT};text-decoration:none;"
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function resetPasswordEmailHtml(resetUrl: string, appUrl: string): string {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
      Reset your password
    </h1>
    <p style="margin:0 0 28px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
      We received a request to reset the password for your SHUZAM account.
      Click the button below to choose a new one — this link expires in
      <strong style="color:${NAVY_TEXT};">1 hour</strong>.
    </p>

    ${ctaButton("Reset password", resetUrl)}

    <p style="margin:28px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:#8d97b3;word-break:break-all;">
      ${resetUrl}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid ${BORDER};">
      <tr>
        <td style="padding-top:20px;">
          <p style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
            Didn't request this? You can safely ignore this email — your
            password won't change unless you open the link above and set a
            new one.
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailShell({
    title: "Reset your SHUZAM password",
    preheader: "Reset your SHUZAM password — this link expires in 1 hour.",
    appUrl,
    bodyHtml,
  });
}

function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function receiptRow(label: string, value: string, isLast = false): string {
  return `
    <tr>
      <td style="padding:12px 0;${isLast ? "" : `border-bottom:1px solid ${BORDER};`}font-family:${FONT_STACK};font-size:14px;color:${MUTED};">
        ${label}
      </td>
      <td align="right" style="padding:12px 0;${isLast ? "" : `border-bottom:1px solid ${BORDER};`}font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${NAVY_TEXT};">
        ${value}
      </td>
    </tr>
  `;
}

export interface PaymentReceiptInput {
  planName: string;
  amountNgn: number;
  reference: string;
  provider: "paystack" | "flutterwave";
  paidAt: Date;
  periodEnd: Date;
}

export function paymentReceiptEmailHtml(input: PaymentReceiptInput, appUrl: string): string {
  const providerLabel = input.provider === "paystack" ? "Paystack" : "Flutterwave";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
      Payment successful
    </h1>
    <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
      Thanks for subscribing to SHUZAM. Your payment has been confirmed and
      your plan is now active — here's your receipt.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      ${receiptRow("Plan", input.planName)}
      ${receiptRow("Amount paid", formatNgn(input.amountNgn))}
      ${receiptRow("Payment method", providerLabel)}
      ${receiptRow("Reference", input.reference)}
      ${receiptRow("Date", formatDate(input.paidAt))}
      ${receiptRow("Renews on", formatDate(input.periodEnd), true)}
    </table>

    ${ctaButton("Go to dashboard", `${appUrl}/dashboard`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid ${BORDER};">
      <tr>
        <td style="padding-top:20px;">
          <p style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
            Keep this email for your records. If you have questions about this
            charge, contact us at
            <a href="mailto:support@shuzam.com" style="color:${NAVY_TEXT};">support@shuzam.com</a>.
          </p>
        </td>
      </tr>
    </table>
  `;

  return emailShell({
    title: "Your SHUZAM payment receipt",
    preheader: `Payment confirmed — ${formatNgn(input.amountNgn)} for ${input.planName}.`,
    appUrl,
    bodyHtml,
  });
}

function featureRow(title: string, description: string): string {
  return `
    <tr>
      <td width="8" valign="top" style="padding:3px 0;">
        <div style="width:6px;height:6px;margin-top:6px;border-radius:50%;background:${LIME};"></div>
      </td>
      <td style="padding:0 0 16px 12px;">
        <p style="margin:0;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${NAVY_TEXT};">
          ${title}
        </p>
        <p style="margin:2px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${MUTED};">
          ${description}
        </p>
      </td>
    </tr>
  `;
}

/**
 * Two variants sharing one shell: a motivating "subscribe" push for
 * newly-registered users with no active plan yet, vs. a short account-features
 * primer for those who already have trial/paid access (e.g. re-registration
 * edge cases, or entitlement already provisioned some other way).
 */
export function welcomeEmailHtml(
  args: { fullName: string | null; isSubscribed: boolean },
  appUrl: string,
): string {
  const firstName = args.fullName?.trim().split(" ")[0] || "there";

  const bodyHtml = args.isSubscribed
    ? `
      <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
        Welcome to SHUZAM, ${firstName}
      </h1>
      <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
        Your account is ready. Here's what you can do right away:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        ${featureRow("Explore recommendations", "See daily picks ranked by confidence tier, backed by data and stats.")}
        ${featureRow("Build an accumulator", "Combine multiple predictions into a single slip and track it.")}
        ${featureRow("Track your watchlist & history", "Follow fixtures you care about and review past predictions.")}
      </table>

      ${ctaButton("Go to dashboard", `${appUrl}/dashboard`)}
    `
    : `
      <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
        Welcome to SHUZAM, ${firstName}
      </h1>
      <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
        You're one step from choosing with insight. Pick a plan to unlock daily
        recommendations, custom match analysis, and accumulator building —
        backed by real data, not gut feeling.
      </p>

      ${ctaButton("Choose your plan", `${appUrl}/onboarding`)}

      <p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
        Not ready to commit? Start with the free trial — no card required.
      </p>
    `;

  return emailShell({
    title: "Welcome to SHUZAM",
    preheader: args.isSubscribed
      ? "Your SHUZAM account is ready — here's where to start."
      : "Welcome to SHUZAM — choose your plan to get started.",
    appUrl,
    bodyHtml,
  });
}

export interface ReferralPointEarnedInput {
  planName: string;
  totalAvailable: number;
}

export function referralPointEarnedEmailHtml(input: ReferralPointEarnedInput, appUrl: string): string {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
      You earned a referral point
    </h1>
    <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
      Two people you referred just paid for the <strong style="color:${NAVY_TEXT};">${input.planName}</strong>
      plan, so you've earned a free ${input.planName} subscription period. You now
      have <strong style="color:${NAVY_TEXT};">${input.totalAvailable}</strong>
      ${input.totalAvailable === 1 ? "point" : "points"} available for that plan —
      redeem them whenever you're ready.
    </p>

    ${ctaButton("View your referrals", `${appUrl}/referrals`)}
  `;

  return emailShell({
    title: "You earned a SHUZAM referral point",
    preheader: `You earned a free ${input.planName} subscription period.`,
    appUrl,
    bodyHtml,
  });
}

export interface ReferralRedeemedInput {
  planName: string;
  pointsUsed: number;
  periodEnd: Date;
}

export function referralRedeemedEmailHtml(input: ReferralRedeemedInput, appUrl: string): string {
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY_TEXT};">
      Referral points redeemed
    </h1>
    <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${MUTED};">
      You redeemed <strong style="color:${NAVY_TEXT};">${input.pointsUsed}</strong>
      ${input.pointsUsed === 1 ? "point" : "points"} for a free
      <strong style="color:${NAVY_TEXT};">${input.planName}</strong> subscription.
      Your plan is active now and runs until
      <strong style="color:${NAVY_TEXT};">${formatDate(input.periodEnd)}</strong>.
    </p>

    ${ctaButton("Go to dashboard", `${appUrl}/dashboard`)}
  `;

  return emailShell({
    title: "Your SHUZAM referral redemption",
    preheader: `Redeemed ${input.pointsUsed} ${input.pointsUsed === 1 ? "point" : "points"} for ${input.planName}.`,
    appUrl,
    bodyHtml,
  });
}
