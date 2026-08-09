import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

const SCORES = [
  { score: "2-1", probability: 14 },
  { score: "1-1", probability: 12 },
  { score: "2-0", probability: 11 },
  { score: "1-0", probability: 10 },
];

export function ProductPreview() {
  return (
    <section className="shuzam-dark bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Product preview
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Every angle on every match
          </h2>
          <p className="mt-3 text-muted-foreground">
            A look inside the SHUZAM app — match overview, form, and analytical breakdowns in one
            clean view.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-2">
          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Result probability</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Home, draw, and away likelihood from the outcome model.
              </p>
              <div className="mt-5 flex items-end gap-3">
                {[
                  { label: "Home", value: 58 },
                  { label: "Draw", value: 24 },
                  { label: "Away", value: 18 },
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
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Goal-scoring likelihood</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A clean read on expected attacking output from both sides.
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
                    <span className="text-[10px] text-muted-foreground">BTTS</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Expected goal lines</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Multiple over/under lines scored from the same model.
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
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">Scoreline probability</p>
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
      </div>
    </section>
  );
}
