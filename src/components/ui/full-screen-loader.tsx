import { Loader2, Zap, TriangleAlert } from "lucide-react";

/**
 * Full-page branded status screen shown while a redirect is in flight (post
 * sign-in, post-payment) so there's never a silent gap between "action
 * succeeded" and the browser actually landing on the next page.
 */
export function FullScreenLoader({
  title,
  description,
  variant = "loading",
}: {
  title: string;
  description?: string;
  variant?: "loading" | "error";
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="h-6 w-6" />
        </span>
        {variant === "loading" ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <TriangleAlert className="h-7 w-7 text-destructive" />
        )}
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">{title}</p>
          {description && (
            <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
