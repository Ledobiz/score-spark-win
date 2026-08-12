"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminPlan } from "@/lib/admin";
import { json } from "@/components/admin/shared";
import { FormCardSkeleton } from "@/components/ui/skeletons";

export function SubscriptionsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => json<{ plans: AdminPlan[] }>("/api/admin/plans"),
  });
  const [creating, setCreating] = useState(false);

  const mut = useMutation({
    mutationFn: (patch: Partial<AdminPlan> & { id: string }) =>
      json("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      toast.success("Plan updated");
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: (input: NewPlanInput) =>
      json("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      toast.success("Plan created");
      setCreating(false);
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      json<{ archived: boolean }>("/api/admin/plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: (res) => {
      toast.success(
        res.archived
          ? "Plan archived (still referenced by existing subscribers)"
          : "Plan deleted",
      );
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "New plan"}
        </Button>
      </div>
      {creating && (
        <NewPlanForm
          onCreate={(input) => create.mutate(input)}
          saving={create.isPending}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <FormCardSkeleton key={i} lines={5} />
          ))}
        {!isLoading && (data?.plans ?? []).map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            onSave={(patch) => mut.mutate({ id: p.id, ...patch })}
            onDelete={() => del.mutate(p.id)}
            saving={mut.isPending}
            deleting={del.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface NewPlanInput {
  name: string;
  interval: string;
  intervalDays: number;
  priceNgn: number;
  dailyRecommendationLimit: number;
  dailyCustomPredictionLimit: number;
  canUseAccumulator: boolean;
  canExportHistory: boolean;
}

function NewPlanForm({
  onCreate,
  saving,
}: {
  onCreate: (input: NewPlanInput) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [intervalLabel, setIntervalLabel] = useState("month");
  const [intervalDays, setIntervalDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [dailyRec, setDailyRec] = useState(0);
  const [dailyCustom, setDailyCustom] = useState(0);
  const [acc, setAcc] = useState(true);
  const [exp, setExp] = useState(true);

  return (
    <Card className="p-4">
      <h3 className="font-semibold">New plan</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-2">
          Name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </label>
        <label>
          Interval label
          <Input
            value={intervalLabel}
            onChange={(e) => setIntervalLabel(e.target.value)}
            placeholder="e.g. month, year, 7 days"
            className="mt-1"
          />
        </label>
        <label>
          Interval days
          <Input
            type="number"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Price (NGN)
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Daily recs (0 = unlimited default)
          <Input
            type="number"
            value={dailyRec}
            onChange={(e) => setDailyRec(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Daily custom (0 = unlimited default)
          <Input
            type="number"
            value={dailyCustom}
            onChange={(e) => setDailyCustom(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
          <span>Accumulator</span>
          <Switch checked={acc} onCheckedChange={setAcc} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
          <span>Export history</span>
          <Switch checked={exp} onCheckedChange={setExp} />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          disabled={!name.trim()}
          loading={saving}
          onClick={() =>
            onCreate({
              name,
              interval: intervalLabel,
              intervalDays,
              priceNgn: price,
              dailyRecommendationLimit: dailyRec,
              dailyCustomPredictionLimit: dailyCustom,
              canUseAccumulator: acc,
              canExportHistory: exp,
            })
          }
        >
          Create plan
        </Button>
      </div>
    </Card>
  );
}

function PlanCard({
  plan,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  plan: AdminPlan;
  onSave: (patch: Partial<AdminPlan>) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [name, setName] = useState(plan.name);
  const [intervalDays, setIntervalDays] = useState(plan.intervalDays);
  const [price, setPrice] = useState(plan.priceNgn);
  const [dailyRec, setDailyRec] = useState(plan.dailyRecommendationLimit);
  const [dailyCustom, setDailyCustom] = useState(
    plan.dailyCustomPredictionLimit,
  );
  const [acc, setAcc] = useState(plan.canUseAccumulator);
  const [exp, setExp] = useState(plan.canExportHistory);
  const [referralsPerPoint, setReferralsPerPoint] = useState(plan.referralsPerPoint);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Card className={`p-4 ${!plan.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{plan.id}</h3>
        <div className="flex items-center gap-2">
          {!plan.isActive && <Badge variant="secondary">Archived</Badge>}
          <Badge variant="secondary">{plan.interval}</Badge>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-2">
          Name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </label>
        <label>
          Price (NGN)
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Interval days
          <Input
            type="number"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Daily recs
          <Input
            type="number"
            value={dailyRec}
            onChange={(e) => setDailyRec(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label>
          Daily custom
          <Input
            type="number"
            value={dailyCustom}
            onChange={(e) => setDailyCustom(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
          <span>Accumulator</span>
          <Switch checked={acc} onCheckedChange={setAcc} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
          <span>Export history</span>
          <Switch checked={exp} onCheckedChange={setExp} />
        </div>
        <label className="col-span-2">
          Referrals per point (0 = default of 2)
          <Input
            type="number"
            value={referralsPerPoint}
            onChange={(e) => setReferralsPerPoint(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <div className="col-span-2 flex items-center justify-between rounded-md border border-border/60 p-2">
          <span>Active (visible to users)</span>
          <Switch
            checked={plan.isActive}
            onCheckedChange={(v) => onSave({ isActive: v })}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          size="sm"
          variant="destructive"
          loading={deleting}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
        <Button
          size="sm"
          loading={saving}
          onClick={() =>
            onSave({
              name,
              intervalDays,
              priceNgn: price,
              dailyRecommendationLimit: dailyRec,
              dailyCustomPredictionLimit: dailyCustom,
              canUseAccumulator: acc,
              canExportHistory: exp,
              referralsPerPoint,
            })
          }
        >
          Save
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              If any user has ever subscribed or paid for &quot;{plan.name}
              &quot;, it will be archived (hidden from new signups) instead of
              deleted, to preserve their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
