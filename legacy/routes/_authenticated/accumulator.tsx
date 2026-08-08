import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlement } from "@/lib/use-entitlement";
import { Lock, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Pick { id: string; fixture: string; market: string; pick: string; odds: number; confidence: number; }

export const Route = createFileRoute("/_authenticated/accumulator")({ component: AccumulatorPage });

function AccumulatorPage() {
  const { data: ent } = useEntitlement();
  const qc = useQueryClient();
  const canUse = ent?.entitlement.canUseAccumulator ?? false;
  const [picks, setPicks] = useState<Pick[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: recs } = useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => (await supabase.from("recommendations").select("*").order("confidence", { ascending: false }).limit(30)).data ?? [],
  });

  const { data: slips } = useQuery({
    queryKey: ["slips"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      return (await supabase.from("bet_slips").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(10)).data ?? [];
    },
  });

  const combined = picks.reduce((acc, p) => acc * p.odds, 1);

  const add = (r: NonNullable<typeof recs>[number]) => {
    if (picks.find((p) => p.id === r.id)) return;
    setPicks([...picks, { id: r.id, fixture: r.fixture, market: r.market, pick: r.pick, odds: r.odds, confidence: r.confidence }]);
  };

  const save = async () => {
    if (picks.length < 2) { toast.error("Add at least 2 picks."); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("bet_slips").insert({
      user_id: u.user!.id, name: name || `Slip ${new Date().toLocaleDateString()}`,
      picks: picks as unknown as never, combined_odds: combined, status: "pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Slip saved");
    setPicks([]); setName("");
    qc.invalidateQueries({ queryKey: ["slips"] });
  };

  if (!canUse) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Accumulator locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upgrade to combine multiple picks and build accumulators.</p>
          <Link to="/onboarding"><Button className="mt-6">See plans</Button></Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Accumulator builder</h1>
      <p className="mt-1 text-sm text-muted-foreground">Combine top tips into a single slip.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Available tips</h2>
          </div>
          <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
            {recs?.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.fixture}</div>
                  <div className="text-xs text-muted-foreground">{r.league} · {r.market}: <span className="text-foreground">{r.pick}</span></div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-primary">{r.confidence}%</div>
                  <div className="font-mono text-muted-foreground">@{r.odds.toFixed(2)}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => add(r)}><Plus className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold">Your slip</h2>
            <div className="mt-3 space-y-2">
              {picks.length === 0 && <p className="text-sm text-muted-foreground">No picks yet. Add from the left.</p>}
              {picks.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                  <div className="min-w-0"><div className="truncate font-medium">{p.fixture}</div><div className="text-muted-foreground">{p.pick} @ {p.odds.toFixed(2)}</div></div>
                  <Button size="icon" variant="ghost" onClick={() => setPicks(picks.filter((x) => x.id !== p.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/10 p-3">
              <span className="text-xs uppercase text-muted-foreground">Combined odds</span>
              <span className="font-display text-xl font-bold text-primary">{combined.toFixed(2)}</span>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Slip name (optional)" className="mt-3" />
            <Button onClick={save} disabled={saving || picks.length < 2} className="mt-3 w-full">
              <Save className="mr-2 h-4 w-4" /> Save slip
            </Button>
          </Card>

          {slips && slips.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Recent slips</h3>
              <div className="space-y-2">
                {slips.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <div><div className="font-medium">{s.name}</div><div className="text-muted-foreground">{(s.picks as unknown as Pick[]).length} picks · {s.status}</div></div>
                    <span className="font-mono font-semibold text-primary">@{Number(s.combined_odds).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
