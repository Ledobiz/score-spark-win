import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  amIAdmin, adminListUsers, adminSetRole,
  adminListPlans, adminUpdatePlan, adminListActivity,
} from "@/lib/admin.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — PredictPro" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    try {
      const { isAdmin } = await amIAdmin();
      if (!isAdmin) throw redirect({ to: "/dashboard" });
    } catch (e: any) {
      if (e?.isRedirect) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
});

function AdminPage() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin</h1>
        <Badge variant="secondary">Restricted</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Manage users, plans, and monitor activity.</p>

      <Tabs defaultValue="users" className="mt-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function UsersTab() {
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => list() });
  const [q, setQ] = useState("");

  const toggle = useMutation({
    mutationFn: (v: { userId: string; grant: boolean }) =>
      setRole({ data: { userId: v.userId, role: "admin", grant: v.grant } }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((u: any) =>
    !q || (u.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Input placeholder="Search email or name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <div className="text-xs text-muted-foreground">{filtered.length} users</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="py-6 text-muted-foreground" colSpan={5}>Loading…</td></tr>}
            {filtered.map((u: any) => {
              const isAdmin = u.roles?.includes("admin");
              return (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{u.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-2 pr-3">{u.subscription?.plan_id ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={u.subscription?.status === "active" ? "default" : "secondary"}>
                      {u.subscription?.status ?? "none"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-3">
                    <Switch
                      checked={!!isAdmin}
                      onCheckedChange={(v) => toggle.mutate({ userId: u.id, grant: v })}
                    />
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td className="py-6 text-muted-foreground" colSpan={5}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlansTab() {
  const list = useServerFn(adminListPlans);
  const update = useServerFn(adminUpdatePlan);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "plans"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (patch: any) => update({ data: patch }),
    onSuccess: () => { toast.success("Plan updated"); qc.invalidateQueries({ queryKey: ["admin", "plans"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(data ?? []).map((p: any) => (
        <PlanCard key={p.id} plan={p} onSave={(patch) => mut.mutate({ id: p.id, ...patch })} saving={mut.isPending} />
      ))}
    </div>
  );
}

function PlanCard({ plan, onSave, saving }: { plan: any; onSave: (patch: any) => void; saving: boolean }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price_ngn);
  const [dailyRec, setDailyRec] = useState(plan.daily_recommendation_limit);
  const [dailyCustom, setDailyCustom] = useState(plan.daily_custom_prediction_limit);
  const [acc, setAcc] = useState(plan.can_use_accumulator);
  const [exp, setExp] = useState(plan.can_export_history);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{plan.id}</h3>
        <Badge variant="secondary">{plan.interval}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-2">Name<Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></label>
        <label>Price (NGN)<Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1" /></label>
        <label>Daily recs<Input type="number" value={dailyRec} onChange={(e) => setDailyRec(Number(e.target.value))} className="mt-1" /></label>
        <label>Daily custom<Input type="number" value={dailyCustom} onChange={(e) => setDailyCustom(Number(e.target.value))} className="mt-1" /></label>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2"><span>Accumulator</span><Switch checked={acc} onCheckedChange={setAcc} /></div>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2"><span>Export history</span><Switch checked={exp} onCheckedChange={setExp} /></div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={saving} onClick={() => onSave({
          name, price_ngn: price,
          daily_recommendation_limit: dailyRec,
          daily_custom_prediction_limit: dailyCustom,
          can_use_accumulator: acc, can_export_history: exp,
        })}>Save</Button>
      </div>
    </Card>
  );
}

function ActivityTab() {
  const list = useServerFn(adminListActivity);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "activity"], queryFn: () => list() });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total users" value={data?.totals.users ?? 0} />
        <Stat label="Recent activity events" value={data?.totals.activity ?? 0} />
        <Stat label="Recommendations" value={data?.totals.recommendations ?? 0} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold">Subscriptions breakdown</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data?.totals.subCounts ?? {}).map(([k, v]) => (
            <Badge key={k} variant="secondary">{k}: {v as number}</Badge>
          ))}
          {!isLoading && Object.keys(data?.totals.subCounts ?? {}).length === 0 && (
            <span className="text-sm text-muted-foreground">No subscriptions yet.</span>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold">Recent user activity</h3>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">When</th><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Type</th></tr>
              </thead>
              <tbody>
                {(data?.activity ?? []).map((a: any) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{a.user_id.slice(0, 8)}…</td>
                    <td className="py-2 pr-3">{a.activity_type}</td>
                  </tr>
                ))}
                {!isLoading && (data?.activity.length ?? 0) === 0 && (
                  <tr><td className="py-6 text-muted-foreground" colSpan={3}>No activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Recent recommendations</h3>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Kickoff</th><th className="py-2 pr-3">Fixture</th>
                  <th className="py-2 pr-3">Market</th><th className="py-2 pr-3">Pick</th>
                  <th className="py-2 pr-3">Odds</th><th className="py-2 pr-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recommendations ?? []).map((r: any) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">{new Date(r.kickoff).toLocaleString()}</td>
                    <td className="py-2 pr-3">{r.fixture}</td>
                    <td className="py-2 pr-3">{r.market}</td>
                    <td className="py-2 pr-3 font-medium">{r.pick}</td>
                    <td className="py-2 pr-3">{r.odds}</td>
                    <td className="py-2 pr-3">{r.result ?? "—"}</td>
                  </tr>
                ))}
                {!isLoading && (data?.recommendations.length ?? 0) === 0 && (
                  <tr><td className="py-6 text-muted-foreground" colSpan={6}>No recommendations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}
