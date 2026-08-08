"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PredictionCardMock } from "@/components/marketing/prediction-card-mock";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern mask-fade-x [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-20 right-0 h-[400px] w-[500px] rounded-full bg-chart-2/20 blur-[110px] [animation-delay:-6s]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8 lg:pt-24">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            10+ markets refreshed daily across 6 major leagues
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Football predictions,
            <br />
            <span className="text-gradient">backed by data</span> — not hype.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            PredictPro scores every fixture with a real model — 1X2, BTTS, Over/Under,
            expected goals and scorelines — and shows you an honest confidence tier for
            each pick, so you know exactly how much to trust it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="group font-semibold">
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="font-medium">
                <PlayCircle className="h-4 w-4" />
                See how it works
              </Button>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              No card required for trial
            </span>
            <span>Cancel anytime</span>
            <span>18+ · Informational, not betting advice</span>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 32, scale: 0.97 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-md lg:mx-0"
        >
          <PredictionCardMock />
        </motion.div>
      </div>
    </section>
  );
}
