import { Info, LineChart, Radar, Trophy } from "lucide-react";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal } from "@/components/marketing/reveal";
import type { Insights, Stats } from "@/lib/predictions/types";

type StatsStripProps = {
  stats: Stats;
  insights: Insights;
};

export function StatsStrip({ stats, insights }: StatsStripProps) {
  const accuracyRate = stats.overall.success_rate;
  const confidentTier = insights.tiers.confident;
  const confidentRate = confidentTier.success_rate;

  return (
    <section id="track-record" className="border-y border-border/70 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Honest track record
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            We show you the real numbers — no inflated win rates
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delay={0}>
            <StatTile
              icon={<LineChart className="h-5 w-5 text-primary" />}
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
              label="Real-world 1X2 accuracy"
              hint={
                stats.unavailable
                  ? "Live stats are temporarily unavailable — check back shortly."
                  : "In line with the bookmaker's own line — the edge is in confidence tiers, not fantasy win rates."
              }
            />
          </Reveal>
          <Reveal delay={0.08}>
            <StatTile
              icon={<Trophy className="h-5 w-5 text-primary" />}
              value={<CountUp value={7} className="font-display text-3xl font-bold" />}
              label="Competitions tracked"
              hint="Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, World Cup."
            />
          </Reveal>
          <Reveal delay={0.16}>
            <StatTile
              icon={<Radar className="h-5 w-5 text-primary" />}
              value={<CountUp value={10} suffix="+" className="font-display text-3xl font-bold" />}
              label="Markets per fixture"
              hint="1X2, double chance, BTTS, Over/Under lines, correct score, and more."
            />
          </Reveal>
          <Reveal delay={0.24}>
            <StatTile
              icon={<Info className="h-5 w-5 text-primary" />}
              value={
                <span className="font-display text-3xl font-bold">
                  {confidentRate != null ? `${(confidentRate * 100).toFixed(1)}%` : "Tiered"}
                </span>
              }
              label="Confident-tier picks"
              hint={`Predictions above ${Math.round(insights.tiers.threshold * 100)}% confidence are flagged separately — track their real hit rate in Insights.`}
            />
          </Reveal>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          Predictions are model outputs for informational purposes only, not betting advice.
          Past performance does not guarantee future results.
        </p>
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
    <div className="group rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">{icon}</div>
      <div className="mt-4">{value}</div>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
