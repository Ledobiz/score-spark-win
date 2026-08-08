import "server-only";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { prisma } from "@/lib/prisma";

const FALLBACK_PLANS = [
  {
    id: "free_trial",
    name: "Free trial",
    interval: "7 days",
    priceNgn: 0,
    features: [
      "Daily recommendations across markets",
      "Custom predictions per fixture",
      "Accumulator / bet-slip builder",
      "Prediction history",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    interval: "month",
    priceNgn: 4999,
    features: [
      "Everything in trial",
      "Unlimited daily recommendations",
      "CSV export of prediction history",
      "Priority email tips",
    ],
  },
];

export async function Pricing() {
  const rows = await prisma.plan
    .findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
    .catch(() => null);
  const plans =
    rows && rows.length > 0
      ? rows.map((p) => ({
          id: p.id,
          name: p.name,
          interval: p.interval,
          priceNgn: p.priceNgn,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
        }))
      : FALLBACK_PLANS;

  const paidPlans = plans.filter((p) => p.priceNgn > 0);
  const highlightId =
    paidPlans[Math.floor((paidPlans.length - 1) / 2)]?.id ?? plans[1]?.id;

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pricing</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Start free, upgrade when you&apos;re ready
        </h2>
        <p className="mt-3 text-muted-foreground">
          7 days full access, no card required. Cancel anytime.
        </p>
      </Reveal>

      <RevealGroup
        className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2"
        stagger={0.1}
      >
        {plans.map((plan) => {
          const highlighted = plan.id === highlightId;
          return (
            <RevealItem key={plan.id}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                  highlighted ? "border-primary/70 glow-accent" : "border-border/70"
                }`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  {plan.priceNgn === 0 ? (
                    <span className="font-display text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-bold">
                        ₦{plan.priceNgn.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground"> / {plan.interval}</span>
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?mode=signup" className="mt-6">
                  <Button className="w-full font-semibold" variant={highlighted ? "default" : "secondary"}>
                    {plan.priceNgn === 0 ? "Start free trial" : "Get started"}
                  </Button>
                </Link>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
