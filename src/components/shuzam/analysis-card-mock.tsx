"use client";

import { motion, useReducedMotion } from "motion/react";
import { Activity, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const OUTCOME = [
  { label: "Home", team: "Arsenal", value: 58 },
  { label: "Draw", team: "", value: 24 },
  { label: "Away", team: "Chelsea", value: 18 },
];

/** Illustrative match-analysis mock used in the SHUZAM hero — synthetic sample data. */
export function AnalysisCardMock() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-chart-3/15 blur-2xl"
      />

      <div className="absolute -right-4 -top-4 hidden w-40 rotate-6 rounded-xl border border-border bg-card/80 p-3 opacity-80 backdrop-blur-sm sm:block">
        <p className="text-[10px] font-medium text-muted-foreground">Form index (5)</p>
        <p className="mt-1 font-display text-lg font-bold text-primary">W W D L W</p>
        <p className="text-[10px] text-muted-foreground">Arsenal, last 5</p>
      </div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Card className="relative overflow-hidden border-border/80 p-5 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Premier League · Match analysis
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <Activity className="h-3 w-3" /> High confidence
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-secondary font-display text-sm font-bold">
                AFC
              </div>
              <p className="mt-1.5 text-sm font-semibold">Arsenal</p>
            </div>
            <p className="font-display text-xs font-medium text-muted-foreground">VS</p>
            <div className="flex-1 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-secondary font-display text-sm font-bold">
                CFC
              </div>
              <p className="mt-1.5 text-sm font-semibold">Chelsea</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Match outcome model
              </span>
              <span>Home win favoured</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              {OUTCOME.map((seg, i) => (
                <motion.div
                  key={seg.label}
                  initial={reduceMotion ? undefined : { width: 0 }}
                  whileInView={reduceMotion ? undefined : { width: `${seg.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={reduceMotion ? { width: `${seg.value}%` } : undefined}
                  className={
                    i === 0 ? "bg-primary" : i === 1 ? "bg-chart-3" : "bg-muted-foreground/40"
                  }
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Home {OUTCOME[0].value}%</span>
              <span>Draw {OUTCOME[1].value}%</span>
              <span>Away {OUTCOME[2].value}%</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-secondary/70 px-2 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">Goals trend</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">62% BTTS</p>
            </div>
            <div className="rounded-lg bg-secondary/70 px-2 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">O/U 2.5</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">57%</p>
            </div>
            <div className="rounded-lg bg-secondary/70 px-2 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">xG</p>
              <p className="mt-0.5 flex items-center justify-center gap-0.5 text-sm font-bold text-foreground">
                1.8–1.1
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
