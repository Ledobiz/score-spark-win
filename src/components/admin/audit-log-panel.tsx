"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminAuditLogRow } from "@/lib/admin";
import { json, fmt } from "@/components/admin/shared";
import { TableRowsSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 30;

export function AuditLogPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", page],
    queryFn: () =>
      json<{ rows: AdminAuditLogRow[]; total: number }>(
        `/api/admin/audit-log?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-4">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Actor</th>
              <th className="py-2 pr-3">Action</th>
              <th className="py-2 pr-3">Target</th>
              <th className="py-2 pr-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <TableRowsSkeleton rows={8} cols={5} />}
            {!isLoading && rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 align-top">
                <td className="py-2 pr-3 text-muted-foreground">
                  {fmt(r.createdAt)}
                </td>
                <td className="py-2 pr-3">{r.actorEmail ?? r.actorId.slice(0, 8)}</td>
                <td className="py-2 pr-3">
                  <Badge variant="secondary">{r.action}</Badge>
                </td>
                <td className="py-2 pr-3">
                  {r.targetEmail ?? r.targetUserId.slice(0, 8)}
                </td>
                <td className="py-2 pr-3">
                  <pre className="max-w-xs whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                    {r.details ? JSON.stringify(r.details) : "—"}
                  </pre>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="py-6 text-muted-foreground" colSpan={5}>
                  No admin actions recorded yet.
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
