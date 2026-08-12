"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Gift, Link2, Lock, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton, FormCardSkeleton, TableRowsSkeleton } from "@/components/ui/skeletons";
import { useReferrals } from "@/lib/use-referrals";
import { useEntitlement } from "@/lib/use-entitlement";

export default function ReferralsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useReferrals();
  const { data: ent } = useEntitlement();
  const [redeemAmounts, setRedeemAmounts] = useState<Record<string, number>>({});
  const [redeemingPlanId, setRedeemingPlanId] = useState<string | null>(null);

  const hasActiveSubscription = ent?.entitlement.isActive ?? false;

  const copyLink = async () => {
    if (!data?.referralLink) return;
    await navigator.clipboard.writeText(data.referralLink);
    toast.success("Referral link copied");
  };

  const redeem = async (planId: string, available: number) => {
    const points = redeemAmounts[planId] ?? 0;
    if (!Number.isInteger(points) || points <= 0 || points > available) {
      toast.error("Enter a valid number of points to redeem");
      return;
    }
    setRedeemingPlanId(planId);
    try {
      const res = await fetch("/api/referrals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, points }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Failed to redeem points");
        return;
      }
      toast.success("Redeemed! Your subscription has been activated.");
      setRedeemAmounts((prev) => ({ ...prev, [planId]: 0 }));
      qc.invalidateQueries({ queryKey: ["referrals"] });
      qc.invalidateQueries({ queryKey: ["entitlement"] });
    } finally {
      setRedeemingPlanId(null);
    }
  };

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Referrals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends. When enough of them pay for the same plan, you earn a
        free period of that plan to redeem whenever you like.
      </p>

      <Card className="mt-6 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> How it works
        </div>
        <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              1
            </span>
            <span>
              Share your referral link or code (below) with friends — they can
              paste the code in at sign up, or just use your link.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              2
            </span>
            <span>
              Only their <strong className="text-foreground">first-ever</strong>{" "}
              successful payment counts — it must be for a plan, and renewals
              don&apos;t count again.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              3
            </span>
            <span>
              Every plan tracks its referrals separately. Once enough people
              have paid for the <strong className="text-foreground">same plan</strong>{" "}
              (the &quot;X / Y referrals to next point&quot; badge below shows your
              progress), you earn 1 point for that plan.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              4
            </span>
            <span>
              1 point = 1 free billing period of <strong className="text-foreground">that same plan</strong>{" "}
              (points don&apos;t convert between plans). Redeem points whenever
              you like — you don&apos;t have to use them all at once, and unused
              points are saved for later.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              5
            </span>
            <span>
              Redeeming activates a subscription immediately, so it&apos;s only
              available while you don&apos;t already have an active subscription
              running.
            </span>
          </li>
        </ol>
      </Card>

      {isLoading ? (
        <FormCardSkeleton lines={1} />
      ) : (
        <Card className="mt-6 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4 text-primary" /> Your referral link
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={data?.referralLink ?? ""} className="font-mono text-xs sm:text-sm" />
            <Button onClick={copyLink} className="shrink-0">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Or share your code directly:{" "}
            <span className="font-mono font-medium text-foreground">{data?.referralCode}</span>
          </p>
        </Card>
      )}

      <h2 className="mt-8 text-lg font-semibold">Your points</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        One card per plan — the badge shows how many qualifying referrals
        you&apos;re at toward your next point on that plan.
      </p>
      {isLoading ? (
        <CardListSkeleton count={2} className="mt-3 grid gap-3 sm:grid-cols-2" />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(data?.plans ?? []).map((plan) => (
            <Card key={plan.planId} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{plan.planName}</div>
                <Badge variant="secondary">
                  {plan.qualifyingReferrals} / {plan.referralsPerPoint} referrals to next point
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {plan.available} point{plan.available === 1 ? "" : "s"} available
                {plan.redeemed > 0 && ` · ${plan.redeemed} redeemed`}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={plan.available}
                  value={redeemAmounts[plan.planId] ?? ""}
                  onChange={(e) =>
                    setRedeemAmounts((prev) => ({ ...prev, [plan.planId]: Number(e.target.value) }))
                  }
                  disabled={plan.available === 0 || hasActiveSubscription}
                  className="w-24"
                />
                <Button
                  size="sm"
                  onClick={() => redeem(plan.planId, plan.available)}
                  disabled={plan.available === 0 || hasActiveSubscription}
                  loading={redeemingPlanId === plan.planId}
                >
                  Redeem
                </Button>
              </div>
              {hasActiveSubscription && plan.available > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Redeem once your current subscription ends.
                </p>
              )}
            </Card>
          ))}
          {(data?.plans.length ?? 0) === 0 && (
            <EmptyState
              icon={Gift}
              title="No plans available yet"
              description="Referral points will show up here once plans are configured."
            />
          )}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">People you referred</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone who signed up with your link or code. &quot;Paid&quot; means
        their first payment has already counted toward your points.
      </p>
      {isLoading ? (
        <CardListSkeleton count={3} className="mt-3 space-y-3" />
      ) : (data?.referredUsers.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="No referrals yet"
          description="Share your link above — once someone signs up and pays, they'll show up here."
          className="mt-3"
        />
      ) : (
        <div className="mt-3 space-y-2">
          {data?.referredUsers.map((u) => (
            <Card key={u.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{u.name || u.email || "Referred user"}</div>
                <div className="text-xs text-muted-foreground">
                  Joined {format(new Date(u.joinedAt), "MMM d, yyyy")}
                </div>
              </div>
              <Badge variant={u.hasPaid ? "default" : "secondary"}>
                {u.hasPaid ? "Paid" : "Not paid yet"}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Redemption history</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every time you&apos;ve redeemed points for free subscription time.
      </p>
      <Card className="mt-3 p-4">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Points used</th>
                <th className="py-2 pr-3">Period end</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton rows={3} cols={4} />}
              {!isLoading &&
                data?.redemptions.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="py-2 pr-3">{r.planName}</td>
                    <td className="py-2 pr-3">{r.pointsUsed}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {format(new Date(r.periodEndAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              {!isLoading && (data?.redemptions.length ?? 0) === 0 && (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={4}>
                    No redemptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
