import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Database,
  Eye,
  GraduationCap,
  History,
  Lightbulb,
  LineChart,
  Search,
  Swords,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/shuzam/site-header";
import { SiteFooter } from "@/components/shuzam/site-footer";
import { BrandStory } from "@/components/shuzam/brand-story";
import { CtaSection } from "@/components/shuzam/cta-section";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "About SHUZAM — Sports Intelligence & Analytics",
  description:
    "SHUZAM is a sports intelligence and analytics platform built to make sports data easier to explore, understand, and learn from.",
};

const WHAT_WE_DO = [
  { icon: BarChart3, label: "Sports analytics" },
  { icon: LineChart, label: "Data visualization" },
  { icon: Swords, label: "Match & team analysis" },
  { icon: Users, label: "Player insights" },
  { icon: History, label: "Historical statistics" },
  { icon: GraduationCap, label: "Sports education" },
  { icon: BrainCircuit, label: "Predictive analytics" },
  { icon: Search, label: "Research & exploration" },
];

const APPROACH = [
  {
    icon: Database,
    title: "Data",
    description: "Start with meaningful, reliable sports data.",
  },
  {
    icon: Lightbulb,
    title: "Insight",
    description: "Turn data into understandable analysis.",
  },
  {
    icon: BookOpen,
    title: "Education",
    description: "Help users understand not only the result, but also the information behind it.",
  },
];

export default function AboutPage() {
  return (
    <div className="theme-shuzam min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="shuzam-dark relative overflow-hidden bg-background py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern mask-fade-x [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-50" />
          <div
            aria-hidden
            className="animate-aurora pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                About SHUZAM
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                A world where sports fans don&apos;t just watch the game
                <span className="text-gradient-shuzam"> — they understand it.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                SHUZAM is a sports intelligence and analytics platform built to make sports data
                easier to explore, understand, and learn from.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center text-muted-foreground">
              <p className="text-base leading-relaxed">
                Sports contain an enormous amount of information — scores, player performances,
                team form, historical results, trends, and countless other data points. SHUZAM
                exists to turn that information into useful, understandable insights.
              </p>
            </Reveal>

            <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2" stagger={0.1}>
              <RevealItem>
                <div className="h-full rounded-2xl border border-border bg-card p-7">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Target className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold">Our Mission</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    To make sports intelligence accessible, understandable, and useful to
                    everyone — bridging the gap between raw sports data and meaningful
                    understanding.
                  </p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="h-full rounded-2xl border border-border bg-card p-7">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold">Our Vision</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    A world where sports fans don&apos;t just watch the game — they understand it,
                    and become more informed, analytical sports enthusiasts.
                  </p>
                </div>
              </RevealItem>
            </RevealGroup>
          </div>
        </section>

        <BrandStory />

        <section className="shuzam-dark bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                What we do
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                The main areas we work in
              </h2>
            </Reveal>

            <RevealGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WHAT_WE_DO.map((item) => (
                <RevealItem key={item.label}>
                  <div className="flex h-full flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-5 text-center">
                    <item.icon className="h-5 w-5 text-primary" />
                    <p className="text-xs font-medium leading-snug">{item.label}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Our approach
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Three principles guide everything
              </h2>
            </Reveal>

            <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-3" stagger={0.1}>
              {APPROACH.map((step, i) => (
                <RevealItem key={step.title}>
                  <div className="relative h-full rounded-2xl border border-border bg-card p-6">
                    <span className="absolute right-5 top-5 font-display text-2xl font-bold text-foreground/10">
                      0{i + 1}
                    </span>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-foreground">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.2} className="mt-12 flex justify-center">
              <Link href="/auth?mode=signup">
                <Button size="lg" className="group font-semibold">
                  Explore SHUZAM
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </Reveal>
          </div>
        </section>

        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
