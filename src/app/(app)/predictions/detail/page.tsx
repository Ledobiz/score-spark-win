"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readDetailed } from "@/lib/predictions/detail-store";
import type {
  DetailedPrediction,
  FactorGroup,
  FactorRow,
} from "@/lib/predictions/types";

const LINES = [0.5, 1.5, 2.5, 3.5];
const pct = (x: number) => x * 100;
const p1 = (x: number) => (x * 100).toFixed(1);
const p0 = (x: number) => (x * 100).toFixed(0);

export default function DetailPage() {
  const [detailed, setDetailed] = useState<DetailedPrediction | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDetailed(readDetailed());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!detailed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-xl font-bold">No prediction loaded</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a prediction first, then tap &ldquo;More Info&rdquo;.
        </p>
        <Link href="/predictions" className="mt-4 inline-block">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to predictions
          </Button>
        </Link>
      </Card>
    );
  }

  const d = detailed;
  const home = d.home_team,
    away = d.away_team;
  const o = d.outcomes;
  const mls = d.most_likely_score;

  return (
    <>
      <Link
        href="/predictions"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to predictions
      </Link>

      {/* Hero */}
      <Card className="p-6">
        <div className="text-xs uppercase text-muted-foreground">
          {d.competition}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div
            className="min-w-0 truncate text-right font-display text-base font-bold sm:text-2xl"
            title={home}
          >
            {home}
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold tabular-nums">
              {mls.home}–{mls.away}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              most likely · {p0(mls.probability)}%
            </div>
          </div>
          <div
            className="min-w-0 truncate text-left font-display text-base font-bold sm:text-2xl"
            title={away}
          >
            {away}
          </div>
        </div>

        {/* 1X2 bar */}
        <div className="mt-5 flex h-3 overflow-hidden rounded-full">
          <div style={{ width: `${pct(o.home_win)}%` }} className="bg-primary" />
          <div style={{ width: `${pct(o.draw)}%` }} className="bg-amber-400" />
          <div style={{ width: `${pct(o.away_win)}%` }} className="bg-rose-400" />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
          <span className="min-w-0 truncate">
            <b>{p0(o.home_win)}%</b> {home}
          </span>
          <span className="shrink-0">
            <b>{p0(o.draw)}%</b> Draw
          </span>
          <span className="min-w-0 truncate">
            <b>{p0(o.away_win)}%</b> {away}
          </span>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Expected goals{" "}
          <b className="text-foreground">{d.expected_goals.home.toFixed(2)}</b> vs{" "}
          <b className="text-foreground">{d.expected_goals.away.toFixed(2)}</b>
        </div>

        {/* Pick */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {d.confident && (
            <Badge className="bg-primary/15 text-primary">
              Confident pick · {p0(d.confidence)}%
            </Badge>
          )}
          <Badge variant="secondary">
            Safer: {dcLabel(d.double_chance.label, home, away)} ·{" "}
            {p0(d.double_chance.probability)}%
          </Badge>
        </div>
      </Card>

      {/* Head-to-head */}
      {d.head_to_head?.count > 0 && (
        <Section title="Head-to-head" tag={`${d.head_to_head.count} meetings`}>
          <p className="text-sm text-muted-foreground">
            {home} {d.head_to_head.home_wins ?? 0}W · {d.head_to_head.draws ?? 0}D ·{" "}
            {d.head_to_head.away_wins ?? 0}L for {away}
            {d.head_to_head.first_year
              ? ` (since ${d.head_to_head.first_year})`
              : ""}
          </p>
          {/* Card list — small screens, avoids a horizontally-scrolling table */}
          <div className="mt-3 grid gap-2 sm:hidden">
            {d.head_to_head.meetings.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {m.home} vs {m.away}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.year}</p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">
                  {m.home_goals}–{m.away_goals}
                </span>
              </div>
            ))}
          </div>

          {/* Table — sm and up */}
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 pr-3">Match</th>
                  <th className="py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {d.head_to_head.meetings.map((m, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-muted-foreground">{m.year}</td>
                    <td className="py-2 pr-3">
                      {m.home} vs {m.away}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {m.home_goals}–{m.away_goals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Edge vs market */}
      {d.edge && (
        <Section
          title="Model edge vs market"
          tag={d.edge.value ? "value" : "no value"}
        >
          <div className="flex flex-wrap gap-4 text-sm">
            {(["home_win", "draw", "away_win"] as const).map((k) => (
              <div key={k} className="rounded-lg border border-border px-3 py-2">
                <div className="text-xs uppercase text-muted-foreground">
                  {outcomeName(k, home, away)}
                </div>
                <div
                  className={`font-mono font-semibold ${
                    d.edge!.by_outcome[k] > 0
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {d.edge!.by_outcome[k] > 0 ? "+" : ""}
                  {p1(d.edge!.by_outcome[k])}%
                </div>
              </div>
            ))}
          </div>
          {d.edge.value && (
            <p className="mt-3 text-sm text-primary">
              Value on{" "}
              <b>{outcomeName(d.edge.best_outcome, home, away)}</b> — model rates
              it {p1(d.edge.best_edge)}% above the market.
            </p>
          )}
        </Section>
      )}

      {/* Knockout */}
      {d.is_cup && d.knockout && (
        <Section title="To qualify" tag="extra time / penalties">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div
              style={{ width: `${pct(d.knockout.home_advance)}%` }}
              className="bg-primary"
            />
            <div
              style={{ width: `${pct(d.knockout.away_advance)}%` }}
              className="bg-rose-400"
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
            <span className="min-w-0 truncate">
              <b>{p0(d.knockout.home_advance)}%</b> {home}
            </span>
            <span className="min-w-0 truncate">
              {away} <b>{p0(d.knockout.away_advance)}%</b>
            </span>
          </div>
        </Section>
      )}

      {/* Reasoning + form */}
      {d.reasoning && d.reasoning.length > 0 && (
        <Section
          title="Why this prediction"
          tag={d.method === "ml" ? "learned model" : d.method}
        >
          {d.form && (
            <div className="mb-3 grid grid-cols-2 gap-3">
              <FormCard team={home} f={d.form.home} />
              <FormCard team={away} f={d.form.away} />
            </div>
          )}
          <ul className="space-y-1.5 text-sm">
            {d.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Factors */}
      {d.factors && (
        <Section title="Data behind this prediction">
          {d.factors.compare.map((g: FactorGroup) => (
            <div key={g.group} className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {g.group}
              </div>
              <div className="space-y-1.5">
                {g.rows.map((row: FactorRow, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm"
                  >
                    <div className="text-right font-mono font-semibold">
                      {fmtVal(row.home, row.fmt)}
                    </div>
                    <div className="px-2 text-center text-xs text-muted-foreground">
                      {row.label}
                    </div>
                    <div className="text-left font-mono font-semibold">
                      {fmtVal(row.away, row.fmt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {d.factors.context?.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {d.factors.context.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Goals — over / under</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={LINES.map((l) => ({
                line: `${l}`,
                Over: +p1(d.goal_markets[`over_${l}`] ?? 0),
                Under: +p1(d.goal_markets[`under_${l}`] ?? 0),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="line" fontSize={12} />
              <YAxis unit="%" fontSize={12} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="Over" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Under" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Scoreline probability</h3>
          <Heatmap matrix={d.score_matrix} home={home} away={away} />
        </Card>
      </div>

      {/* BTTS + top scores */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Both teams to score</h3>
          <div className="flex h-3 overflow-hidden rounded-full">
            <div style={{ width: `${pct(d.btts.yes)}%` }} className="bg-primary" />
            <div style={{ width: `${pct(d.btts.no)}%` }} className="bg-secondary" />
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>
              <b>{p0(d.btts.yes)}%</b> Yes
            </span>
            <span>
              No <b>{p0(d.btts.no)}%</b>
            </span>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Most likely scorelines</h3>
          <div className="flex flex-wrap gap-2">
            {d.top_scores.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-border px-3 py-2 text-center"
              >
                <div className="font-mono font-bold">
                  {s.home}–{s.away}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p1(s.probability)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Section({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-4 p-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {tag && (
          <Badge variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        )}
      </div>
      {children}
    </Card>
  );
}

function FormCard({
  team,
  f,
}: {
  team: string;
  f: { elo: number; form: string; ppg: number };
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="truncate text-sm font-semibold">{team}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Elo {f.elo} · {f.ppg} ppg
      </div>
      <div className="mt-1 font-mono text-sm tracking-widest">{f.form}</div>
    </div>
  );
}

function Heatmap({
  matrix,
  home,
  away,
}: {
  matrix: number[][];
  home: string;
  away: string;
}) {
  const max = Math.max(...matrix.flat(), 1e-9);
  return (
    <div>
      <div className="grid grid-cols-6 gap-1">
        {matrix.map((row, i) =>
          row.map((v, j) => (
            <div
              key={`${i}-${j}`}
              title={`${home} ${i} – ${j} ${away}: ${(v * 100).toFixed(1)}%`}
              className="grid aspect-square place-items-center rounded font-mono text-[10px]"
              style={{
                backgroundColor: `color-mix(in oklch, var(--color-primary) ${Math.round(
                  8 + 92 * (v / max),
                )}%, transparent)`,
              }}
            >
              {i}-{j}
            </div>
          )),
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>
          {home} goals ↓ · {away} goals →
        </span>
      </div>
    </div>
  );
}

function outcomeName(k: string, home: string, away: string): string {
  return k === "home_win" ? home : k === "away_win" ? away : "Draw";
}
function dcLabel(label: string, home: string, away: string): string {
  if (label === "home_or_draw") return `${home} or Draw`;
  if (label === "home_or_away") return `${home} or ${away}`;
  if (label === "draw_or_away") return `Draw or ${away}`;
  return label;
}
function fmtVal(v: number | string, fmt: string): string {
  if (typeof v === "string") return v;
  if (fmt === "pct") return `${(v * 100).toFixed(0)}%`;
  if (fmt === "int") return `${Math.round(v)}`;
  return v.toFixed(2);
}
