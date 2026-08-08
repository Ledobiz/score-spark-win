import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
    </Card>
  );
}

export function StatCardGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className ?? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({
  height = "h-56",
  title = true,
}: {
  height?: string;
  title?: boolean;
}) {
  return (
    <Card className="p-4">
      {title && <Skeleton className="mb-4 h-4 w-40" />}
      <Skeleton className={`w-full ${height}`} />
    </Card>
  );
}

/** Renders `rows` skeleton `<tr>`s — slot directly into an existing `<tbody>`. */
export function TableRowsSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border/60">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-2.5 pr-3">
              <Skeleton className="h-4 w-full max-w-[9rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        </Card>
      ))}
    </div>
  );
}

/** A single row for flat (non-card) lists, e.g. a tips/recommendations list. */
export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-3 w-10" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        </div>
      ))}
    </>
  );
}

export function FormCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-4 w-28" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}
