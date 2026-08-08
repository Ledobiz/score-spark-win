import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/15 via-card to-chart-2/10 px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="animate-aurora pointer-events-none absolute -bottom-24 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Stop guessing. Start predicting with data.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join PredictPro free — no card required — and see every fixture broken
              down with honest, model-backed confidence.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth?mode=signup">
                <Button size="lg" className="group font-semibold">
                  Start your free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="font-medium">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
