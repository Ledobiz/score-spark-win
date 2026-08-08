"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminPredictionRow } from "@/lib/admin";
import { json, fmt } from "@/components/admin/shared";
import { TableRowsSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 25;

export function PredictionsPanel() {
  const [userEmail, setUserEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const buildParams = (extra?: Record<string, string>) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...extra,
    });
    if (userEmail.trim()) params.set("userEmail", userEmail.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params;
  };

  const predictionsQuery = useQuery({
    queryKey: ["admin", "predictions", userEmail, from, to, page],
    queryFn: () =>
      json<{ rows: AdminPredictionRow[]; total: number }>(
        `/api/admin/predictions?${buildParams().toString()}`,
      ),
  });

  const rows = predictionsQuery.data?.rows ?? [];
  const total = predictionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportUrl = () => {
    const params = buildParams({ export: "csv" });
    return `/api/admin/predictions?${params.toString()}`;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Prediction history</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filter by user email"
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
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
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Fixture</th>
              <th className="py-2 pr-3">Competition</th>
              <th className="py-2 pr-3">Predicted</th>
              <th className="py-2 pr-3">Confidence</th>
              <th className="py-2 pr-3">Result</th>
              <th className="py-2 pr-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {predictionsQuery.isLoading && (
              <TableRowsSkeleton rows={8} cols={7} />
            )}
            {!predictionsQuery.isLoading && rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="py-2 pr-3">{r.userEmail ?? "—"}</td>
                <td className="py-2 pr-3">{r.fixture}</td>
                <td className="py-2 pr-3">{r.competition}</td>
                <td className="py-2 pr-3">{r.predictedOutcome ?? "—"}</td>
                <td className="py-2 pr-3">
                  {r.confidence != null ? `${r.confidence}%` : "—"}
                </td>
                <td className="py-2 pr-3">
                  <Badge variant={r.result ? "default" : "secondary"}>
                    {r.result ?? "Pending"}
                  </Badge>
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {fmt(r.createdAt)}
                </td>
              </tr>
            ))}
            {!predictionsQuery.isLoading && rows.length === 0 && (
              <tr>
                <td className="py-6 text-muted-foreground" colSpan={7}>
                  No predictions match these filters.
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
  );
}
