import { Database, LineChart, Radar, Trophy } from "lucide-react";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal } from "@/components/marketing/reveal";
import type { Insights, Stats } from "@/lib/predictions/types";

type IntroSectionProps = {
  stats: Stats;
  insights: Insights;
};

export function IntroSection({ stats, insights }: IntroSectionProps) {
  const accuracyRate = stats.overall.success_rate;
  const confidentRate = insights.tiers.confident.success_rate;

  return (
    <section id="what-is-shuzam" className="bg-background py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            What is SHUZAM?
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Sports generate enormous amounts of data.
            <br />
            SHUZAM turns it into insight.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Every match produces scores, player performances, team form, historical results, and
            countless other data points. SHUZAM helps turn that information into insights that
            are easier to explore, understand, and learn from — so you don&apos;t just watch the
            game, you understand it.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal delay={0}>
            <StatTile
              icon={<LineChart className="h-5 w-5 text-accent-foreground" />}
              value={
                accuracyRate != null ? (
                  <CountUp
                    value={accuracyRate * 100}
                    decimals={1}
                    suffix="%"
                    className="font-display text-3xl font-bold"
                  />
                ) : (
                  <span className="font-display text-3xl font-bold">—</span>
                )
              }
              label="Real-world model accuracy"
              hint="Shown honestly — not an inflated number."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <StatTile
              icon={<Trophy className="h-5 w-5 text-accent-foreground" />}
              value={<CountUp value={7} className="font-display text-3xl font-bold" />}
              label="Competitions tracked"
              hint="Premier League, La Liga, Serie A, Bundesliga, Ligue 1 & more."
            />
          </Reveal>
          <Reveal delay={0.16}>
            <StatTile
              icon={<Radar className="h-5 w-5 text-accent-foreground" />}
              value={<CountUp value={10} suffix="+" className="font-display text-3xl font-bold" />}
              label="Statistical markets"
              hint="1X2, BTTS, Over/Under, xG, scorelines, and more."
            />
          </Reveal>
          <Reveal delay={0.24}>
            <StatTile
              icon={<Database className="h-5 w-5 text-accent-foreground" />}
              value={
                <span className="font-display text-3xl font-bold">
                  {confidentRate != null ? `${(confidentRate * 100).toFixed(1)}%` : "Tiered"}
                </span>
              }
              label="High-confidence hit rate"
              hint="Confidence tiers are tracked and shown separately."
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  icon,
  value,
  label,
  hint,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/60">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent">{icon}</div>
      <div className="mt-4">{value}</div>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
