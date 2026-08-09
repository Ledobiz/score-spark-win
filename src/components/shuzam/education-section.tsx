import { BookOpen, Compass, GitCompare } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const POINTS = [
  {
    icon: Compass,
    title: "Explore",
    description: "Dig into form, trends, and historical performance at your own pace.",
  },
  {
    icon: GitCompare,
    title: "Understand",
    description: "See how comparisons, trends, and analytical methods actually work.",
  },
  {
    icon: BookOpen,
    title: "Learn",
    description: "Build a sharper eye for the game, one insight at a time.",
  },
];

export function EducationSection() {
  return (
    <section id="education" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Beyond the numbers
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Don&apos;t just see the numbers.
            <br />
            Understand them.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            SHUZAM isn&apos;t only about displaying numbers — it&apos;s about helping you interpret
            them. We explain how statistics, trends, comparisons, and analytical methods can be
            read, so every insight makes you a little sharper.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-3">
          {POINTS.map((point) => (
            <RevealItem key={point.title}>
              <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{point.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
