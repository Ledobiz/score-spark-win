"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { AdminGateway, AdminPaymentRow } from "@/lib/admin";
import { json, fmt, fmtNgn } from "@/components/admin/shared";
import { TableRowsSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_STATUSES = ["pending", "success", "failed"] as const;
const PROVIDERS = ["flutterwave", "paystack"] as const;
const PAGE_SIZE = 25;

function statusVariant(status: string) {
  if (status === "success") return "default" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
}

export function PaymentsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gateways"],
    queryFn: () => json<{ gateways: AdminGateway[] }>("/api/admin/gateways"),
  });

  const mut = useMutation({
    mutationFn: (v: { provider: string; enabled: boolean }) =>
      json("/api/admin/gateways", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      }),
    onSuccess: () => {
      toast.success("Gateway updated");
      qc.invalidateQueries({ queryKey: ["admin", "gateways"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [page, setPage] = useState(1);

  const paymentsQuery = useQuery({
    queryKey: ["admin", "payments", status, provider, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (status !== "all") params.set("status", status);
      if (provider !== "all") params.set("provider", provider);
      return json<{ rows: AdminPaymentRow[]; total: number }>(
        `/api/admin/payments?${params.toString()}`,
      );
    },
  });

  const rows = paymentsQuery.data?.rows ?? [];
  const total = paymentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportUrl = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (status !== "all") params.set("status", status);
    if (provider !== "all") params.set("provider", provider);
    return `/api/admin/payments?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-2/3" />
              <div className="mt-3 flex items-center justify-between rounded-md border border-border/60 p-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </Card>
          ))}
        {(data?.gateways ?? []).map((g) => (
          <Card key={g.provider} className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{g.provider}</h3>
              {!g.keysConfigured && (
                <Badge variant="secondary">Keys not configured</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {g.keysConfigured
                ? "API keys are set — toggling this on makes it available to users at checkout."
                : "No API keys found in the environment for this provider yet. You can enable it now, but it won't work until keys are added."}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
              <span>Enabled</span>
              <Switch
                checked={g.enabled}
                disabled={mut.isPending}
                onCheckedChange={(v) =>
                  mut.mutate({ provider: g.provider, enabled: v })
                }
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Transactions</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={provider}
              onValueChange={(v) => {
                setProvider(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" asChild>
              <a href={exportUrl()} download>
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Reference</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {paymentsQuery.isLoading && (
                <TableRowsSkeleton rows={8} cols={7} />
              )}
              {!paymentsQuery.isLoading && rows.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs">
                    {p.reference}
                  </td>
                  <td className="py-2 pr-3">{p.userEmail ?? "—"}</td>
                  <td className="py-2 pr-3">{p.planName}</td>
                  <td className="py-2 pr-3 capitalize">{p.provider}</td>
                  <td className="py-2 pr-3">{fmtNgn(p.amountNgn)}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {fmt(p.createdAt)}
                  </td>
                </tr>
              ))}
              {!paymentsQuery.isLoading && rows.length === 0 && (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={7}>
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} — {total} total
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
