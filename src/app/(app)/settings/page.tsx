"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { FormCardSkeleton } from "@/components/ui/skeletons";
import { useEntitlement, type EntitlementResponse } from "@/lib/use-entitlement";
import { cancelSubscription } from "@/app/onboarding/actions";

export default function SettingsPage() {
  const { data: ent, isLoading } = useEntitlement();

  if (isLoading || !ent) {
    return <SettingsSkeleton />;
  }

  return <SettingsForm ent={ent} />;
}

function SettingsSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-40" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FormCardSkeleton lines={2} />
        <FormCardSkeleton lines={3} />
        <FormCardSkeleton lines={1} />
        <FormCardSkeleton lines={2} />
      </div>
    </>
  );
}

function SettingsForm({ ent }: { ent: EntitlementResponse }) {
  const qc = useQueryClient();

  const [fullName, setFullName] = useState(ent.profile?.fullName ?? "");
  const [notify, setNotify] = useState(ent.profile?.notifyDailyTips ?? true);
  const planLimit = ent.planDailyCustomPredictionLimit;
  const [limitEnabled, setLimitEnabled] = useState(
    (ent.profile?.dailyViewLimit ?? 0) > 0,
  );
  const [dailyLimit, setDailyLimit] = useState(
    Math.min(ent.profile?.dailyViewLimit || 20, planLimit),
  );
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          notifyDailyTips: notify,
          dailyViewLimit: limitEnabled ? dailyLimit : 0,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["entitlement"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doCancel = async () => {
    if (!confirm("Cancel your subscription?")) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      toast.success("Cancelled");
      qc.invalidateQueries({ queryKey: ["entitlement"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setCancelling(false);
    }
  };

  const e = ent?.entitlement;

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={ent?.email ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <Label htmlFor="fn">Full name</Label>
              <Input
                id="fn"
                value={fullName}
                onChange={(ev) => setFullName(ev.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Subscription</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{ent?.planName ?? "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span>{e?.status ?? "-"}</span>
            </div>
            {e?.daysLeft != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {e.isTrial ? "Trial ends in" : "Renews in"}
                </span>
                <span>{e.daysLeft} days</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/onboarding">
              <Button variant="secondary">Change plan</Button>
            </Link>
            {e?.isActive && e.isPaid && (
              <Button variant="ghost" onClick={doCancel} loading={cancelling}>
                Cancel
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Notifications</h2>
          <label className="mt-4 flex items-center justify-between">
            <span className="text-sm">Daily tips email</span>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </label>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Responsible gambling</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <Label htmlFor="dl-toggle">Daily prediction limit</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Once you hit this many predictions in a day, PredictPro stops
                you from running more until tomorrow — even if your plan
                allows more.
              </p>
            </div>
            <Switch
              id="dl-toggle"
              checked={limitEnabled}
              onCheckedChange={setLimitEnabled}
            />
          </div>
          {limitEnabled && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="dl">Predictions per day</Label>
              <Input
                id="dl"
                type="number"
                min={1}
                max={planLimit}
                value={dailyLimit}
                onChange={(ev) =>
                  setDailyLimit(
                    Math.min(Math.max(Number(ev.target.value) || 1, 1), planLimit),
                  )
                }
                className="max-w-[10rem]"
              />
              <p className="text-xs text-muted-foreground">
                Your {ent.planName ?? "current"} plan allows up to {planLimit} per
                day — this can only make your limit stricter, not looser.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={saving}>
          Save changes
        </Button>
      </div>
    </>
  );
}
