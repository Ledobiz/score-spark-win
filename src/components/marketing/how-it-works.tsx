import { CalendarSearch, LineChart, Sparkles } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const STEPS = [
  {
    icon: CalendarSearch,
    step: "01",
    title: "Pick a league & fixture",
    description:
      "Browse today's fixtures across 7 competitions, or search for the exact match you're interested in.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Get the model's prediction",
    description:
      "See the predicted outcome, confidence tier, xG, scoreline probabilities and the reasoning behind the call.",
  },
  {
    icon: LineChart,
    step: "03",
    title: "Track your record",
    description:
      "Every prediction you view is saved to your history, so you can see exactly how the model performs over time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            From kickoff to confidence in three steps
          </h2>
        </Reveal>

        <RevealGroup className="relative mt-14 grid gap-8 sm:grid-cols-3" stagger={0.15}>
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block"
          />
          {STEPS.map((step) => (
            <RevealItem key={step.step} className="relative flex flex-col items-center text-center">
              <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-border bg-card shadow-sm">
                <step.icon className="h-8 w-8 text-primary" />
                <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
