import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — PredictPro",
  description: "How PredictPro collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        This Privacy Policy explains how [Company Legal Name] (&quot;PredictPro&quot;,
        &quot;we&quot;, &quot;us&quot;) collects, uses, discloses, and protects your personal data
        when you use the Service. It should be read alongside our{" "}
        <Link href="/terms">Terms of Service</Link> and <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li>
          <strong>Account information</strong> — email address, full name, and a securely hashed
          password (we never store your password in plain text). If you sign in with Google, we
          receive your name, email, and profile photo from Google.
        </li>
        <li>
          <strong>Usage &amp; activity data</strong> — leagues and fixtures you view, predictions you
          request, your prediction history, watchlist, and bet-slip/accumulator entries.
        </li>
        <li>
          <strong>Technical data</strong> — IP address, browser/device type, and log data collected
          automatically for security, debugging, and analytics. See our{" "}
          <Link href="/cookies">Cookie Policy</Link> for details.
        </li>
        <li>
          <strong>Billing information</strong> — for paid subscriptions, payment details are
          collected and processed directly by our payment processor; we do not store full card
          numbers on our servers.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and maintain your account and authenticate you (including via Google sign-in);</li>
        <li>To generate and display predictions, dashboards, and your prediction history;</li>
        <li>To process subscription payments and manage billing;</li>
        <li>To send account-related and, if you opt in, prediction-related notifications;</li>
        <li>To detect, prevent, and address fraud, abuse, and security issues;</li>
        <li>To improve and maintain the reliability of the Service.</li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <p>
        Where applicable law requires a legal basis, we process your data on the basis of: performance
        of a contract (providing the Service you signed up for), your consent (e.g. optional
        notifications), and our legitimate interests (security, fraud prevention, and improving the
        Service).
      </p>

      <h2>4. Cookies &amp; Tracking</h2>
      <p>
        We use a minimal set of cookies required to keep you signed in and to remember your theme
        preference. See our <Link href="/cookies">Cookie Policy</Link> for the full list and how to
        control them.
      </p>

      <h2>5. How We Share Information</h2>
      <p>We do not sell your personal data. We share data only with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who host our infrastructure, database, and process
          payments on our behalf, under contractual confidentiality obligations;
        </li>
        <li>
          <strong>Google</strong>, if you choose to sign in with your Google account;
        </li>
        <li>
          <strong>Authorities</strong>, where required to comply with a legal obligation, or to
          protect the rights, safety, or property of PredictPro or our users.
        </li>
      </ul>
      <p>
        Our prediction engine is a separate, headless service that receives only the fixture and
        league you request (never your account details) to generate a prediction.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain account and activity data for as long as your account is active, and for a limited
        period afterward as needed to comply with legal obligations, resolve disputes, and enforce our
        agreements. You may request deletion of your account and associated data at any time (see
        Section 8).
      </p>

      <h2>7. Data Security</h2>
      <p>
        We apply industry-standard safeguards, including password hashing, encrypted connections
        (HTTPS/TLS), and server-side access controls that scope every read and write to your account.
        No system is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>8. Your Rights &amp; Choices</h2>
      <p>
        Depending on your location, you may have the right to access, correct, export, or delete your
        personal data, and to object to or restrict certain processing. You can update your profile
        directly in <Link href="/settings">Settings</Link>, or contact us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> to exercise these rights.
      </p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        The Service is not directed to, and we do not knowingly collect personal data from, anyone
        under 18. If you believe a minor has provided us with personal data, contact us and we will
        delete it.
      </p>

      <h2>10. International Users</h2>
      <p>
        We may process and store your data in countries other than your own. Where required, we take
        appropriate steps to ensure your data receives an adequate level of protection wherever it is
        processed.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected by
        updating the &quot;Last updated&quot; date above.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        For any privacy questions or requests, contact us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
