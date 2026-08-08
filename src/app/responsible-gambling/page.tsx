import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/legal-layout";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Responsible Gambling — PredictPro",
  description:
    "PredictPro provides informational football predictions only. Read our responsible gambling commitment, risk disclosure, and support resources.",
};

export default function ResponsibleGamblingPage() {
  return (
    <LegalLayout title="Responsible Gambling" updated={LEGAL_LAST_UPDATED}>
      <p>
        PredictPro is a data and analytics product. This page explains what that does — and
        doesn&apos;t — mean for how you should use it.
      </p>

      <h2>1. We Are Not a Bookmaker</h2>
      <p>
        PredictPro does not accept bets, hold funds, or process payouts. We have no financial
        relationship tied to whether a prediction is right or wrong. Nothing on the Service is an
        offer to gamble, and nothing here is betting advice — it is statistical output intended for
        informational purposes only.
      </p>

      <h2>2. Understand the Risk</h2>
      <p>
        Football is unpredictable, and so is any model of it. Our historical 1X2 (win/draw/win)
        accuracy sits in roughly the same range as bookmaker-implied odds — commonly cited around the
        mid-50% mark — not the near-certainty that inflated &quot;guaranteed win&quot; services
        sometimes claim. Confidence scores describe how strongly our model favors an outcome; they are
        not a probability of profit and do not account for the odds you may be offered elsewhere.
        Past accuracy does not guarantee future results.
      </p>

      <h2>3. 18+ Only</h2>
      <p>
        The Service is intended for adults aged 18 and over. If you are under 18, do not use the
        Service. If gambling is illegal where you live, do not use predictions from this Service (or
        any other source) to place bets.
      </p>

      <h2>4. Signs of Problem Gambling</h2>
      <p>Consider stepping back and seeking support if you notice yourself:</p>
      <ul>
        <li>Betting more money or time than you can afford to lose;</li>
        <li>Chasing losses or increasing stakes to try to &quot;win back&quot; money;</li>
        <li>Lying to others about how much you bet or spend;</li>
        <li>Feeling anxious, irritable, or preoccupied with betting;</li>
        <li>Letting betting interfere with work, relationships, or finances.</li>
      </ul>

      <h2>5. Play Safer</h2>
      <ul>
        <li>Set a budget before you bet, and stick to it regardless of outcome;</li>
        <li>Never bet money you need for essentials;</li>
        <li>Treat predictions as one input among many, not a certainty;</li>
        <li>
          Use the deposit limits, time-outs, and self-exclusion tools offered by your bookmaker or
          betting platform;
        </li>
        <li>Take regular breaks and avoid betting when upset, tired, or under the influence.</li>
      </ul>

      <h2>6. Getting Help</h2>
      <p>
        If gambling is affecting you or someone you know, free and confidential support is available.
        Search for a licensed problem-gambling support service in your country, or start with one of
        the following well-known organizations:
      </p>
      <ul>
        <li>
          <strong>BeGambleAware</strong> (UK) —{" "}
          <a href="https://www.begambleaware.org" target="_blank" rel="noreferrer">
            begambleaware.org
          </a>
        </li>
        <li>
          <strong>GamCare</strong> (UK) —{" "}
          <a href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">
            gamcare.org.uk
          </a>
        </li>
        <li>
          <strong>National Council on Problem Gambling</strong> (US) —{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noreferrer">
            ncpgambling.org
          </a>
        </li>
        <li>
          <strong>Gamblers Anonymous</strong> (international) —{" "}
          <a href="https://www.gamblersanonymous.org" target="_blank" rel="noreferrer">
            gamblersanonymous.org
          </a>
        </li>
      </ul>

      <h2>7. Contact Us</h2>
      <p>
        Questions about this page or feedback on how we present risk?{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalLayout>
  );
}
