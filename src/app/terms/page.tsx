import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Shuzam",
  description: "The terms and conditions governing use of Shuzam.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated={LEGAL_LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of Shuzam
        (the &quot;Service&quot;), operated by [Company Legal Name] (&quot;Shuzam&quot;,
        &quot;we&quot;, &quot;us&quot;). By creating an account or otherwise using the Service,
        you agree to be bound by these Terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account or use the Service. By registering,
        you represent that you meet this requirement and that your use of the Service complies with
        the laws applicable to you, including any local laws relating to sports betting or
        gambling-related content. You are solely responsible for determining whether it is legal for
        you to access the Service in your jurisdiction.
      </p>

      <h2>2. The Service</h2>
      <p>
        Shuzam provides statistical, model-generated football (soccer) match predictions —
        including outcome probabilities, confidence scores, expected goals, and related analytics —
        for informational and entertainment purposes only.
      </p>
      <ul>
        <li>
          Shuzam is <strong>not a bookmaker, betting exchange, or gambling operator</strong>. We
          do not accept wagers, hold funds on behalf of users, or process payouts of any kind.
        </li>
        <li>
          We are not affiliated with, and do not endorse, any specific bookmaker or betting platform.
        </li>
        <li>
          Predictions are outputs of a statistical model and are not guarantees of any outcome. Our
          historical 1X2 accuracy is in line with typical bookmaker odds (roughly the mid-50% range)
          — see our <Link href="/responsible-gambling">Responsible Gambling</Link> page for more detail.
        </li>
        <li>Nothing on the Service constitutes financial, investment, or betting advice.</li>
      </ul>

      <h2>3. Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activity under your account. Notify us immediately of any unauthorized use. You agree to
        provide accurate registration information and to keep it up to date.
      </p>

      <h2>4. Subscriptions, Free Trial &amp; Billing</h2>
      <p>
        Some features require a paid subscription. New accounts may be eligible for a free trial
        period as described on our <Link href="/#pricing">pricing page</Link>. Paid subscriptions
        renew automatically for successive billing periods until cancelled. See our{" "}
        <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> for details on billing,
        cancellation, and refunds.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of these Terms;</li>
        <li>
          Scrape, reverse-engineer, or systematically extract data from the Service, or resell or
          redistribute predictions or content without our written consent;
        </li>
        <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems;</li>
        <li>Interfere with or disrupt the integrity or performance of the Service;</li>
        <li>Share your account with others or operate multiple accounts to evade usage limits.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including its design, models, text, and underlying software, is owned by
        Shuzam or its licensors and is protected by intellectual property laws. We grant you a
        limited, non-exclusive, non-transferable license to use the Service for your personal,
        non-commercial use, subject to these Terms.
      </p>

      <h2>7. Third-Party Services</h2>
      <p>
        The Service integrates third-party services, including Google for optional sign-in and a
        payment processor for subscription billing. Your use of those integrations is also subject
        to the applicable third party&apos;s terms and privacy policy.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE AND ALL PREDICTIONS, STATISTICS, AND CONTENT ARE PROVIDED &quot;AS IS&quot; AND
        &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
        WARRANTIES OF ACCURACY, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT ANY PREDICTION WILL BE ACCURATE OR THAT USING THE
        SERVICE WILL RESULT IN FAVORABLE BETTING OUTCOMES. ANY DECISION YOU MAKE BASED ON CONTENT
        FROM THE SERVICE, INCLUDING ANY WAGER, IS MADE AT YOUR OWN RISK AND DISCRETION.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHUZAM AND ITS OFFICERS, EMPLOYEES, AND AGENTS
        WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        OR ANY LOSS OF PROFITS, REVENUE, OR FUNDS WAGERED, ARISING FROM OR RELATED TO YOUR USE OF THE
        SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE WILL NOT
        EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time for violation of these
        Terms or for any other reason, with or without notice. You may stop using the Service and
        close your account at any time via <Link href="/settings">Settings</Link>.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify you
        by updating the &quot;Last updated&quot; date above and, where appropriate, by additional
        notice. Continued use of the Service after changes take effect constitutes acceptance of the
        revised Terms.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of [Jurisdiction], without regard to its conflict of
        laws principles, unless mandatory consumer-protection law in your country of residence
        provides otherwise.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
