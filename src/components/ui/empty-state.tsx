import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared "nothing here yet" state — used instead of a blank section/table row
 * whenever a query resolves with zero data, so the UI always explains what
 * should show up and (when relevant) how to make that happen.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = true,
  size = "default",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  bordered?: boolean;
  size?: "default" | "compact";
  className?: string;
}) {
  const compact = size === "compact";
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 p-4" : "gap-3 p-8",
        bordered && "rounded-xl border border-dashed border-border bg-secondary/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "grid shrink-0 place-items-center rounded-full bg-primary/10 text-primary",
          compact ? "h-8 w-8" : "h-11 w-11",
        ].join(" ")}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <div className="space-y-1">
        <p className={compact ? "text-sm font-medium" : "font-medium"}>{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <Button size="sm" className="mt-1">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
