import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const SCORES = [
  { score: "2-1", probability: 14 },
  { score: "1-1", probability: 12 },
  { score: "2-0", probability: 11 },
  { score: "1-0", probability: 10 },
];

export function MarketsShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          The prediction card
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Every angle on every match
        </h2>
        <p className="mt-3 text-muted-foreground">
          One fixture, fully broken down — so you decide with the full picture, not a single number.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-2">
        <RevealItem>
          <div className="h-full rounded-2xl border border-border/70 bg-card p-6">
            <p className="text-sm font-semibold">Double chance</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hedge between two outcomes when the model sees a close call.
            </p>
            <div className="mt-5 flex items-end gap-3">
              {[
                { label: "1X", value: 82 },
                { label: "12", value: 76 },
                { label: "X2", value: 42 },
              ].map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-secondary">
                    <div
                      className="w-full rounded-lg bg-primary/80"
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="h-full rounded-2xl border border-border/70 bg-card p-6">
            <p className="text-sm font-semibold">Both teams to score</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A clean read on attacking output from both sides.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative grid h-32 w-32 place-items-center rounded-full bg-secondary">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(var(--color-primary) 0% 62%, transparent 62% 100%)`,
                  }}
                />
                <div className="relative grid h-24 w-24 place-items-center rounded-full bg-card">
                  <span className="font-display text-2xl font-bold">62%</span>
                  <span className="text-[10px] text-muted-foreground">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="h-full rounded-2xl border border-border/70 bg-card p-6">
            <p className="text-sm font-semibold">Over / Under goals</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Multiple lines scored, from Over 0.5 to Over 3.5.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Over 1.5", value: 79 },
                { label: "Over 2.5", value: 57 },
                { label: "Over 3.5", value: 31 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{row.label}</span>
                    <span>{row.value}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/80" style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="h-full rounded-2xl border border-border/70 bg-card p-6">
            <p className="text-sm font-semibold">Most likely scorelines</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ranked from the full score-probability matrix.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {SCORES.map((s) => (
                <div
                  key={s.score}
                  className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2"
                >
                  <span className="font-display text-sm font-bold">{s.score}</span>
                  <span className="text-xs text-muted-foreground">{s.probability}%</span>
                </div>
              ))}
            </div>
          </div>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
