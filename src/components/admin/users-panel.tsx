"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  AdminPlan,
  AdminUserDetail,
  AdminUserRow,
} from "@/lib/admin";
import { STATUS_OPTIONS, json, fmt } from "@/components/admin/shared";
import { TableRowsSkeleton, FormCardSkeleton } from "@/components/ui/skeletons";

function AccessBadge({
  access,
  daysExpired,
}: {
  access: AdminUserRow["subscriptionAccess"];
  daysExpired: number | null;
}) {
  if (access === "active") return <Badge>Active</Badge>;
  if (access === "expired")
    return (
      <Badge variant="destructive">
        Expired{daysExpired != null ? ` ${daysExpired}d ago` : ""}
      </Badge>
    );
  return <Badge variant="secondary">No subscription</Badge>;
}

export function UsersPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => json<{ users: AdminUserRow[] }>("/api/admin/users"),
  });
  const { data: plansData } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => json<{ plans: AdminPlan[] }>("/api/admin/plans"),
  });
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [access, setAccess] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const remindMut = useMutation({
    mutationFn: (userId: string) =>
      json(`/api/admin/users/${userId}/remind`, { method: "POST" }),
    onSuccess: () => toast.success("Reminder email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { userId: string; grant: boolean }) =>
      json("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: v.userId, role: "admin", grant: v.grant }),
      }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data?.users ?? [];
  const filtered = users.filter((u) => {
    const term = q.trim().toLowerCase();
    if (
      term &&
      !(u.email ?? "").toLowerCase().includes(term) &&
      !(u.fullName ?? "").toLowerCase().includes(term)
    )
      return false;
    if (plan !== "all" && (u.subscription?.planId ?? "none") !== plan)
      return false;
    if (status !== "all" && (u.subscription?.status ?? "none") !== status)
      return false;
    if (access !== "all" && u.subscriptionAccess !== access) return false;
    const joined = new Date(u.createdAt).getTime();
    if (from && joined < new Date(from).getTime()) return false;
    if (to && joined > new Date(to).getTime() + 86400e3 - 1) return false;
    return true;
  });

  const resetFilters = () => {
    setQ("");
    setPlan("all");
    setStatus("all");
    setAccess("all");
    setFrom("");
    setTo("");
  };
  const hasFilters =
    !!q || plan !== "all" || status !== "all" || access !== "all" || !!from || !!to;

  return (
    <Card className="p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          placeholder="Search email or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger>
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="none">No plan</SelectItem>
            {(plansData?.plans ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="none">No subscription</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={access} onValueChange={setAccess}>
          <SelectTrigger>
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="none">No subscription</SelectItem>
          </SelectContent>
        </Select>
        <label className="text-xs text-muted-foreground">
          Joined from
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Joined to
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1"
          />
        </label>
      </div>
      <div className="mb-3 mt-3 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {filtered.length} users
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <a href="/api/admin/users?export=csv" download>
              Export CSV
            </a>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create user
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Access</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3">Admin</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <TableRowsSkeleton rows={8} cols={7} />}
            {!isLoading && filtered.map((u) => {
              const admin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{u.fullName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{u.subscription?.planId ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <Badge
                      variant={
                        u.subscription?.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {u.subscription?.status ?? "none"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <AccessBadge
                      access={u.subscriptionAccess}
                      daysExpired={u.daysExpired}
                    />
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3">
                    <Switch
                      checked={admin}
                      disabled={
                        toggle.isPending && toggle.variables?.userId === u.id
                      }
                      onCheckedChange={(v) =>
                        toggle.mutate({ userId: u.id, grant: v })
                      }
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <div className="flex justify-end gap-2">
                      {u.subscriptionAccess === "expired" && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={
                            remindMut.isPending && remindMut.variables === u.id
                          }
                          onClick={() => remindMut.mutate(u.id)}
                        >
                          Remind
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenUser(u.id)}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="py-6 text-muted-foreground" colSpan={7}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!openUser} onOpenChange={(o) => !o && setOpenUser(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {openUser && (
            <UserDetail
              userId={openUser}
              onDeleted={() => setOpenUser(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        plans={plansData?.plans ?? []}
      />
    </Card>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  plans,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: AdminPlan[];
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [subscriptionChoice, setSubscriptionChoice] = useState("none");
  const paidPlans = plans.filter((p) => p.priceNgn > 0);

  const reset = () => {
    setEmail("");
    setFullName("");
    setPassword("");
    setSubscriptionChoice("none");
  };

  const mut = useMutation({
    mutationFn: () =>
      json<{ userId: string; temporaryPassword: string | null }>(
        "/api/admin/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            fullName: fullName || undefined,
            password: password || undefined,
            startTrial: subscriptionChoice === "trial",
            planId:
              subscriptionChoice !== "trial" && subscriptionChoice !== "none"
                ? subscriptionChoice
                : undefined,
          }),
        },
      ),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      if (result.temporaryPassword) {
        toast.success(
          `User created. Temporary password: ${result.temporaryPassword}`,
          { duration: 15000 },
        );
      } else {
        toast.success("User created");
      }
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Provisions an account directly. There&apos;s no email invite
            system configured, so share the password with the user yourself
            — leave it blank to auto-generate one shown here once.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="newUserEmail">Email</Label>
            <Input
              id="newUserEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUserName">Full name</Label>
            <Input
              id="newUserName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newUserPassword">
              Password (optional — auto-generated if blank)
            </Label>
            <Input
              id="newUserPassword"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Subscription</Label>
            <Select value={subscriptionChoice} onValueChange={setSubscriptionChoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subscription</SelectItem>
                <SelectItem value="trial">Start free trial</SelectItem>
                {paidPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" loading={mut.isPending}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserDetail({
  userId,
  onDeleted,
}: {
  userId: string;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => json<AdminUserDetail>(`/api/admin/users/${userId}`),
  });
  const [targetPlan, setTargetPlan] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<null | {
    action: "set_plan" | "start_trial" | "cancel";
    label: string;
  }>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () =>
      json(`/api/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onDeleted();
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const isSelf = session?.user?.id === userId;

  const mut = useMutation({
    mutationFn: (v: { action: "set_plan" | "start_trial" | "cancel" }) =>
      json("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: v.action,
          planId: targetPlan,
          reason: reason || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("Subscription updated");
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data)
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <FormCardSkeleton lines={1} />
          <FormCardSkeleton lines={1} />
        </div>
        <FormCardSkeleton lines={3} />
      </div>
    );
  const sub = data.subscription;
  const paidPlans = data.plans.filter((p) => p.priceNgn > 0);
  const freePlan = data.plans.find((p) => p.priceNgn === 0);

  return (
    <div className="space-y-5">
      <SheetHeader className="px-0">
        <SheetTitle>{data.profile?.fullName ?? "Unnamed user"}</SheetTitle>
        <SheetDescription>{data.profile?.email ?? userId}</SheetDescription>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Plan" value={sub?.planId ?? "—"} />
        <Field label="Status" value={sub?.status ?? "none"} />
        <Field label="Trial ends" value={fmt(sub?.trialEndsAt)} />
        <Field label="Renews / expires" value={fmt(sub?.currentPeriodEnd)} />
        <Field label="Signed up" value={fmt(data.profile?.createdAt)} />
        <Field
          label="Payment ref"
          value={
            sub?.paymentRef
              ? `${sub.paymentRef}${sub.paymentProvider ? ` (${sub.paymentProvider})` : ""}`
              : "—"
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Quick actions</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={targetPlan || paidPlans[0]?.id || ""}
            onValueChange={setTargetPlan}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paidPlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={mut.isPending}
            onClick={() =>
              setPending({
                action: "set_plan",
                label: `move this user to the "${targetPlan}" plan`,
              })
            }
          >
            Apply plan
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={mut.isPending}
            onClick={() =>
              setPending({
                action: "start_trial",
                label: `start a fresh ${freePlan?.intervalDays ?? 7}-day free trial`,
              })
            }
          >
            Start trial
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={mut.isPending}
            onClick={() =>
              setPending({
                action: "cancel",
                label: "cancel this subscription",
              })
            }
          >
            Cancel
          </Button>
        </div>
        <Input
          placeholder="Reason (optional, saved to audit log)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-destructive">
          Danger zone
        </h4>
        <p className="text-xs text-muted-foreground">
          Permanently deletes this user and all their data (predictions,
          activity, bet slips, watchlist, subscription, payment history).
          This cannot be undone.
        </p>
        <Button
          size="sm"
          variant="destructive"
          disabled={isSelf || deleteMut.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          Delete user
        </Button>
        {isSelf && (
          <p className="text-xs text-muted-foreground">
            You cannot delete your own account.
          </p>
        )}
      </div>

      <Separator />

      <Section title="Recent predictions & activity">
        {data.activity.length === 0 && <Empty>No activity yet.</Empty>}
        {data.activity.map((a) => (
          <Row
            key={a.id}
            left={a.activityType}
            right={new Date(a.createdAt).toLocaleString()}
            sub={
              (a.meta?.fixture as string | undefined) ??
              (a.meta?.market as string | undefined) ??
              null
            }
          />
        ))}
      </Section>

      <Section title="Bet slips">
        {data.slips.length === 0 && <Empty>No slips yet.</Empty>}
        {data.slips.map((s) => (
          <Row
            key={s.id}
            left={s.name ?? "Untitled slip"}
            right={`${s.combinedOdds} · ${s.status}`}
            sub={`${s.picks.length} picks · ${new Date(
              s.createdAt,
            ).toLocaleDateString()}`}
          />
        ))}
      </Section>

      <Section title="Audit log">
        {data.audit.length === 0 && <Empty>No admin changes recorded.</Empty>}
        {data.audit.map((a) => {
          const details = a.details as
            | {
                reason?: string;
                from?: { plan_id?: string };
                to?: { plan_id?: string; status?: string };
              }
            | null;
          return (
            <Row
              key={a.id}
              left={a.action}
              right={new Date(a.createdAt).toLocaleString()}
              sub={
                details?.reason ??
                `${details?.from?.plan_id ?? "none"} → ${
                  details?.to?.plan_id ?? "—"
                } (${details?.to?.status ?? "—"})`
              }
            />
          );
        })}
      </Section>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {pending?.label}. This is recorded in the audit
              log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) mut.mutate({ action: pending.action });
                setPending(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {data.profile?.email ?? "this user"}{" "}
              and all of their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteMut.mutate();
                setConfirmDelete(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-words font-medium">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <div className="max-h-64 space-y-1 overflow-auto">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Row({
  left,
  right,
  sub,
}: {
  left: string;
  right: string;
  sub?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 px-2 py-1.5 text-sm">
      <div>
        <div className="font-medium">{left}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
      <div className="whitespace-nowrap text-xs text-muted-foreground">
        {right}
      </div>
    </div>
  );
}
