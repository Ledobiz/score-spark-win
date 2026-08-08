"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startFreeTrial } from "./actions";
import type { PlanRow } from "@/app/api/plans/route";

const FEATURES = [
  "Daily recommendations across markets",
  "Custom predictions per fixture",
  "Accumulator / bet-slip builder",
  "Prediction history + performance",
  "Watchlist for leagues & teams",
  "Priority email tips",
];

const GATEWAY_LABELS: Record<string, string> = {
  flutterwave: "Flutterwave",
  paystack: "Paystack",
};

async function fetchPlans(): Promise<PlanRow[]> {
  const res = await fetch("/api/plans");
  if (!res.ok) throw new Error("Failed to load plans");
  const data = (await res.json()) as { plans: PlanRow[] };
  return data.plans;
}

async function fetchGateways(): Promise<string[]> {
  const res = await fetch("/api/payments/gateways");
  if (!res.ok) throw new Error("Failed to load payment methods");
  const data = (await res.json()) as { gateways: string[] };
  return data.gateways;
}

function OnboardingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const { data: gateways } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: fetchGateways,
  });

  useEffect(() => {
    const payment = search.get("payment");
    if (payment === "success") {
      toast.success("Payment successful — welcome aboard!");
      router.replace("/dashboard");
    } else if (payment === "failed") {
      toast.error("Payment failed or was cancelled. Please try again.");
    }
  }, [search, router]);

  const paidPlans = plans?.filter((p) => p.priceNgn > 0) ?? [];
  const highlightId =
    paidPlans[Math.floor((paidPlans.length - 1) / 2)]?.id ?? plans?.[1]?.id;
  const freePlan = plans?.find((p) => p.priceNgn === 0);

  const pickFree = async () => {
    setBusy("free");
    try {
      await startFreeTrial();
      await queryClient.invalidateQueries({ queryKey: ["entitlement"] });
      toast.success("Free trial started");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  };

  const startPayment = async (planId: string, provider: string) => {
    setBusy(`${planId}:${provider}`);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");
      window.location.href = data.redirectUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Pick your plan
          </h1>
          <p className="mt-2 text-muted-foreground">
            Start with a {freePlan?.intervalDays ?? 7}-day free trial. No card
            required. Cancel anytime.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans?.map((p) => {
            const highlight = p.id === highlightId;
            const isFree = p.priceNgn === 0;
            return (
              <Card
                key={p.id}
                className={`relative flex flex-col p-6 ${
                  highlight ? "border-primary/70 glow-accent" : ""
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                <div className="mt-4">
                  {isFree ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        ₦{p.priceNgn.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / {p.interval}
                      </span>
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Button
                    onClick={pickFree}
                    disabled={busy !== null}
                    className="mt-6 w-full font-semibold"
                    variant={highlight ? "default" : "secondary"}
                  >
                    {busy === "free" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start free trial"
                    )}
                  </Button>
                ) : gateways === undefined ? (
                  <Button disabled className="mt-6 w-full font-semibold" variant="secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Button>
                ) : gateways.length === 0 ? (
                  <div className="mt-6 space-y-1.5">
                    <Button disabled className="w-full font-semibold" variant="secondary">
                      Unavailable
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Payments are temporarily unavailable — check back soon.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-2">
                    {gateways.map((g) => (
                      <Button
                        key={g}
                        onClick={() => startPayment(p.id, g)}
                        disabled={busy !== null}
                        className="w-full font-semibold"
                        variant={highlight ? "default" : "secondary"}
                      >
                        {busy === `${p.id}:${g}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          `Pay with ${GATEWAY_LABELS[g] ?? g}`
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
          {gateways && gateways.length > 0 ? (
            <p>
              <strong className="text-foreground">Payments:</strong> secure
              checkout via {gateways.map((g) => GATEWAY_LABELS[g] ?? g).join(" or ")}
              . You&apos;ll be redirected to complete payment, then brought back
              here.
            </p>
          ) : (
            <p>
              <strong className="text-foreground">Payments:</strong> paid plans
              are temporarily unavailable while payment gateways are being set
              up — the free trial above works right now.
            </p>
          )}
        </div>
        <div className="mt-6 space-y-1 text-center text-sm">
          <p className="font-semibold">What&apos;s included</p>
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            {FEATURES.map((f) => (
              <span key={f}>✓ {f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
