import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startFreeTrial, activatePlan } from "@/lib/subscriptions.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Onboarding,
});

const FEATURES = [
  "Daily recommendations across markets",
  "Custom predictions per fixture",
  "Accumulator / bet-slip builder",
  "Prediction history + performance",
  "Watchlist for leagues & teams",
  "Priority email tips",
];

function Onboarding() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const startTrial = useServerFn(startFreeTrial);
  const activate = useServerFn(activatePlan);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await supabase.from("plans").select("*").order("sort_order")).data ?? [],
  });

  const pick = async (planId: string) => {
    setBusy(planId);
    try {
      if (planId === "free_trial") await startTrial();
      else await activate({ data: { planId: planId as "weekly" | "monthly" | "annual", flutterwaveRef: `demo_${Date.now()}` } });
      toast.success("Plan activated");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><Zap className="h-6 w-6" /></div>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Pick your plan</h1>
          <p className="mt-2 text-muted-foreground">Start with a 14-day free trial. No card required. Cancel anytime.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans?.map((p) => {
            const highlight = p.id === "monthly";
            return (
              <Card key={p.id} className={`relative flex flex-col p-6 ${highlight ? "border-primary/70 glow-accent" : ""}`}>
                {highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</span>}
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                <div className="mt-4">
                  {p.price_ngn === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">₦{p.price_ngn.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground"> / {p.interval}</span>
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {(p.features as string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => pick(p.id)} disabled={busy !== null} className="mt-6 w-full font-semibold" variant={highlight ? "default" : "secondary"}>
                  {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (p.id === "free_trial" ? "Start free trial" : "Subscribe")}
                </Button>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
          <p><strong className="text-foreground">Payments:</strong> Flutterwave (NGN) integration wiring will use your API keys once added; this demo activates plans instantly.</p>
        </div>
        <div className="mt-6 space-y-1 text-center text-sm">
          <p className="font-semibold">What's included</p>
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            {FEATURES.map((f) => <span key={f}>✓ {f}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
