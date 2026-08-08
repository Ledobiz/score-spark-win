import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — PredictPro",
  description: "How free trials, subscription billing, cancellation, and refunds work on PredictPro.",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund &amp; Cancellation Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        This policy explains how billing, cancellation, and refunds work for PredictPro subscriptions,
        and forms part of our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>1. Free Trial</h2>
      <p>
        New accounts may start a free trial with no card required. If you take no action, your
        account reverts to the free plan at the end of the trial — you will not be charged
        automatically.
      </p>

      <h2>2. Subscription Billing</h2>
      <p>
        Paid plans are billed in advance for each billing period (e.g. monthly) and renew
        automatically until cancelled. Prices are shown on our{" "}
        <Link href="/#pricing">pricing page</Link> and may change from time to time; we will notify
        you in advance of any price change that affects your active subscription.
      </p>

      <h2>3. Cancelling Your Subscription</h2>
      <p>
        You can cancel anytime from <Link href="/settings">Settings</Link>. Cancellation stops future
        renewals; you keep access to paid features until the end of your current billing period.
      </p>

      <h2>4. Refunds</h2>
      <p>
        Because you retain access for the remainder of a paid period after cancelling, we generally do
        not provide prorated refunds for unused time. We will issue a full refund if:
      </p>
      <ul>
        <li>You were charged due to a verified billing error on our part; or</li>
        <li>You were charged after cancelling but before the change took effect.</li>
      </ul>
      <p>
        Where required by consumer-protection law in your country, we will honor any mandatory
        statutory refund or cooling-off rights, regardless of the above.
      </p>

      <h2>5. Failed Payments</h2>
      <p>
        If a renewal payment fails, we may retry the charge and will notify you. Your access to paid
        features may be paused until payment succeeds or you update your payment method.
      </p>

      <h2>6. Requesting a Refund</h2>
      <p>
        To request a refund or dispute a charge, contact us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> with your account email
        and the transaction date. We aim to respond within 5 business days.
      </p>
    </LegalLayout>
  );
}
