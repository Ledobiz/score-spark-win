"use client";

import { ArrowRight, BrainCircuit, Database, Lightbulb } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const FORM_TREND = [32, 41, 38, 52, 47, 61, 58, 70, 66, 78];

const H2H = [
  { label: "Possession", a: 58, b: 42 },
  { label: "Shots on target", a: 64, b: 36 },
  { label: "xG", a: 55, b: 45 },
];

const MATCHWEEK_GOALS = [
  { label: "GW6", value: 24 },
  { label: "GW7", value: 31 },
  { label: "GW8", value: 19 },
  { label: "GW9", value: 36 },
  { label: "GW10", value: 28 },
];

const FORM_TABLE = [
  { team: "Arsenal", points: 24, trend: "up" as const },
  { team: "Man City", points: 23, trend: "same" as const },
  { team: "Liverpool", points: 21, trend: "up" as const },
  { team: "Chelsea", points: 18, trend: "down" as const },
];

const STEPS = [
  { icon: Database, label: "Raw Data", hint: "Scores, form, statistics" },
  { icon: BrainCircuit, label: "Analysis", hint: "Patterns & context" },
  { icon: Lightbulb, label: "Insight", hint: "Clear, useful understanding" },
];

export function DataVisualization() {
  return (
    <section id="data" className="shuzam-dark relative overflow-hidden bg-background py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.35]" />
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -bottom-40 left-1/4 h-[480px] w-[700px] rounded-full bg-primary/10 blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            How SHUZAM thinks
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            From raw data to clear insight
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3 sm:gap-5">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:gap-5">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-sm font-bold">{step.label}</p>
                  <p className="text-[11px] text-muted-foreground">{step.hint}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-4 lg:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Team form trend</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Performance index over the last 10 matches.
              </p>
              <div className="mt-6 flex h-32 items-end gap-1.5">
                {FORM_TREND.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/70 transition-all duration-300 first:rounded-t-sm hover:bg-primary"
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Head-to-head comparison</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Key statistical categories, side by side.
              </p>
              <div className="mt-6 space-y-4">
                {H2H.map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{row.label}</span>
                    </div>
                    <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${row.a}%` }} />
                      <div className="h-full bg-chart-3" style={{ width: `${row.b}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Goals by matchweek</p>
              <p className="mt-1 text-xs text-muted-foreground">
                League-wide scoring trend across recent matchweeks.
              </p>
              <div className="mt-6 flex h-28 items-end justify-between gap-3">
                {MATCHWEEK_GOALS.map((row) => (
                  <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end overflow-hidden rounded-md bg-secondary">
                      <div className="w-full rounded-md bg-chart-3" style={{ height: `${row.value * 2.4}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Form table snapshot</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Illustrative standings from the last 5 rounds.
              </p>
              <div className="mt-5 space-y-1">
                {FORM_TABLE.map((row, i) => (
                  <div
                    key={row.team}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm even:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                      <span className="font-medium">{row.team}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold">{row.points} pts</span>
                      <TrendDot trend={row.trend} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </RevealItem>
        </RevealGroup>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          Illustrative example visualizations — built to show how SHUZAM presents data, not live
          match results.
        </p>
      </div>
    </section>
  );
}

function TrendDot({ trend }: { trend: "up" | "down" | "same" }) {
  const color =
    trend === "up" ? "bg-chart-1" : trend === "down" ? "bg-chart-5" : "bg-muted-foreground";
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />;
}
