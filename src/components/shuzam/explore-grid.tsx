import { BarChart3, BrainCircuit, GraduationCap, LineChart, Swords, Users } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const EXPLORE = [
  {
    icon: Swords,
    title: "Match Analysis",
    description: "Explore team form, historical performance, trends, and key statistics.",
  },
  {
    icon: Users,
    title: "Player Insights",
    description: "Understand player performance through meaningful statistics and comparisons.",
  },
  {
    icon: BarChart3,
    title: "Team Analytics",
    description:
      "Compare teams and explore performance across different periods and competitions.",
  },
  {
    icon: LineChart,
    title: "Data & Trends",
    description: "Discover patterns hidden within sports data.",
  },
  {
    icon: GraduationCap,
    title: "Sports Education",
    description: "Learn how to interpret statistics and understand analytical concepts.",
  },
  {
    icon: BrainCircuit,
    title: "Predictive Analytics",
    description: "Explore data-driven forecasts as part of a broader analytical experience.",
  },
];

export function ExploreGrid() {
  return (
    <section id="explore" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          What you can explore
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          One platform, every angle on the game
        </h2>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPLORE.map((feature) => (
          <RevealItem key={feature.title}>
            <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
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
