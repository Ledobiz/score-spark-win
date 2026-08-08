import {
  BarChart3,
  Bell,
  Gauge,
  History,
  Layers,
  ListChecks,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const FEATURES = [
  {
    icon: Layers,
    title: "10+ markets, every fixture",
    description:
      "1X2, double chance, BTTS, Over/Under lines and correct scorelines — scored for every match, not just the headline result.",
  },
  {
    icon: Gauge,
    title: "Honest confidence tiers",
    description:
      "Every pick ships with a confidence score, so you know the difference between a coin-flip and a high-conviction call.",
  },
  {
    icon: BarChart3,
    title: "xG & model reasoning",
    description:
      "See the expected goals, form, and head-to-head factors behind each prediction — not just a black-box verdict.",
  },
  {
    icon: ListChecks,
    title: "Accumulator builder",
    description:
      "Combine picks across fixtures into a slip and see the blended odds and combined confidence at a glance.",
  },
  {
    icon: History,
    title: "Full prediction history",
    description:
      "Every prediction you've viewed is saved with its outcome, so you can audit the model's real performance over time.",
  },
  {
    icon: Bell,
    title: "Watchlist & alerts",
    description:
      "Track your favourite leagues and teams and jump straight to their next fixture predictions.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Everything you need
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Built for people who take predictions seriously
        </h2>
        <p className="mt-3 text-muted-foreground">
          No gut feelings, no guesswork — just a consistent model and the transparency to trust it.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <RevealItem key={feature.title}>
            <div className="group h-full rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
