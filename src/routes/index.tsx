import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Shield, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-4 w-4" /></span>
            PredictPro
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Data-driven football predictions
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Bet smarter with <span className="text-primary">AI-powered</span> predictions
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Daily tips across EPL, La Liga, Serie A, Bundesliga and Ligue 1 — with win probabilities, confidence scores, and an accumulator builder.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}><Button size="lg" className="font-semibold">Start 14-day free trial</Button></Link>
            <Link to="/auth"><Button size="lg" variant="secondary">Sign in</Button></Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No card required · Cancel anytime · 18+</p>
        </div>
      </section>

      <section className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          {[
            { icon: TrendingUp, title: "10+ markets daily", body: "Home/Away wins, BTTS, Over 1.5/2.5, and more." },
            { icon: LineChart, title: "Confidence scores", body: "Every tip includes a % confidence and odds context." },
            { icon: Shield, title: "Performance tracked", body: "See how past tips resolved with full history." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-secondary/30 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <p className="font-semibold text-foreground">18+ Responsible Gambling</p>
        <p className="mt-1">Predictions are informational, not guarantees. Never bet more than you can afford to lose.</p>
      </footer>
    </div>
  );
}
