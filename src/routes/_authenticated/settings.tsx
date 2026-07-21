import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEntitlement } from "@/lib/use-entitlement";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { cancelSubscription } from "@/lib/subscriptions.functions";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { data: ent } = useEntitlement();
  const qc = useQueryClient();
  const cancel = useServerFn(cancelSubscription);

  const [fullName, setFullName] = useState("");
  const [notify, setNotify] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(50);

  useEffect(() => {
    if (ent?.profile) {
      setFullName(ent.profile.full_name ?? "");
      setNotify(ent.profile.notify_daily_tips);
      setDailyLimit(ent.profile.daily_view_limit);
    }
  }, [ent]);

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, notify_daily_tips: notify, daily_view_limit: dailyLimit,
    }).eq("id", u.user.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["entitlement"] });
  };

  const doCancel = async () => {
    if (!confirm("Cancel your subscription?")) return;
    await cancel(); toast.success("Cancelled"); qc.invalidateQueries();
  };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-4 space-y-3">
            <div><Label>Email</Label><Input value={ent?.user.email ?? ""} disabled className="mt-1" /></div>
            <div><Label htmlFor="fn">Full name</Label><Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Subscription</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-semibold">{ent?.plan?.name ?? "None"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{ent?.entitlement.status ?? "-"}</span></div>
            {ent?.entitlement.daysLeft !== null && (
              <div className="flex justify-between"><span className="text-muted-foreground">{ent?.entitlement.isTrial ? "Trial ends in" : "Renews in"}</span><span>{ent?.entitlement.daysLeft} days</span></div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/onboarding"><Button variant="secondary">Change plan</Button></Link>
            {ent?.entitlement.isActive && ent.entitlement.isPaid && (
              <Button variant="ghost" onClick={doCancel}>Cancel</Button>
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
          <div className="mt-4 space-y-2">
            <Label htmlFor="dl">Daily view limit</Label>
            <Input id="dl" type="number" min={1} max={500} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">A soft limit reminding you when you've viewed enough predictions today.</p>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save}>Save changes</Button>
      </div>
    </AppShell>
  );
}
