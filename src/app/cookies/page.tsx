import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy — Shuzam",
  description: "The cookies Shuzam uses and how to control them.",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        This Cookie Policy explains how Shuzam uses cookies and similar technologies, and works
        alongside our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device by your browser. They let a site remember
        information about your visit, such as your sign-in state or preferences.
      </p>

      <h2>2. Cookies We Use</h2>
      <ul>
        <li>
          <strong>Essential / authentication cookies</strong> — a secure, encrypted session cookie
          keeps you signed in. These are required for the Service to function and cannot be disabled
          without losing access to your account.
        </li>
        <li>
          <strong>Preference cookies</strong> — remember your light/dark theme preference.
        </li>
        <li>
          <strong>Third-party sign-in</strong> — if you choose &quot;Continue with Google&quot;,
          Google sets its own cookies as part of the OAuth sign-in flow, governed by Google&apos;s own
          policies.
        </li>
      </ul>
      <p>
        We do not currently use advertising or third-party analytics/tracking cookies. If that
        changes, we will update this policy and, where required, ask for your consent first.
      </p>

      <h2>3. Managing Cookies</h2>
      <p>
        Most browsers let you block or delete cookies through their settings. Because our
        authentication cookie is essential, blocking it will sign you out and prevent access to the
        authenticated parts of the Service. Disabling third-party cookies may prevent Google sign-in
        from working — you can still use email/password sign-in instead.
      </p>

      <h2>4. Changes to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time; changes will be reflected by updating the
        &quot;Last updated&quot; date above.
      </p>

      <h2>5. Contact Us</h2>
      <p>
        Questions about our use of cookies? Contact us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
