import Link from "next/link";
import { ShuzamLogo } from "@/components/shuzam/logo";

const FOOTER_LINKS = {
  Explore: [
    { href: "/#explore", label: "What you can explore" },
    { href: "/#data", label: "Data & insight" },
    { href: "/#education", label: "Sports education" },
  ],
  Company: [
    { href: "/about", label: "About SHUZAM" },
    { href: "/auth?mode=signup", label: "Get started" },
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
    <footer className="shuzam-dark border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" aria-label="SHUZAM home">
              <ShuzamLogo />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Sports intelligence &amp; analytics — helping people understand the game through
              data, statistics, and intelligent analysis.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-sm font-semibold text-white">{group}</p>
              <ul className="mt-3 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-white"
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
          <p>© {new Date().getFullYear()} SHUZAM. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            18+ only. Predictive analytics are statistical model outputs for informational and
            educational purposes, not a guarantee of results. Please{" "}
            <Link href="/responsible-gambling" className="underline underline-offset-2 hover:text-white">
              play responsibly
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          <p>
            SHUZAM® is a product of Ledobiz Technologies Limited. SHUZAM is a sports
            intelligence and analytics platform providing data, statistics, and predictive
            insights. It is not a bookmaker or gambling operator and does not accept or
            facilitate wagers. All predictive outputs are statistical estimates for
            informational and educational purposes only.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Ledobiz Technologies Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
