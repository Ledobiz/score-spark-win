import Link from "next/link";
import { TrendingUp } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#track-record", label: "Track record" },
  ],
  Account: [
    { href: "/auth?mode=signup", label: "Start free trial" },
    { href: "/auth", label: "Sign in" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/responsible-gambling", label: "Responsible Gambling" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <TrendingUp className="h-[18px] w-[18px]" />
              </span>
              Shuzam
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Data-driven football predictions with honest confidence tiers. Model outputs are
              informational only and not betting advice.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-sm font-semibold">{group}</p>
              <ul className="mt-3 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Shuzam. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            18+ only. Gambling can be addictive — please{" "}
            <Link href="/responsible-gambling" className="underline underline-offset-2 hover:text-foreground">
              play responsibly
            </Link>
            . Predictions are statistical model outputs for informational purposes and not a
            guarantee of results.
          </p>
        </div>
      </div>
    </footer>
  );
}
