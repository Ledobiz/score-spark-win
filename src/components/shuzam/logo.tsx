import { cn } from "@/lib/utils";

const MARK_PATH =
  "M 82 38 C 82 24 68 17 52 20 C 36 23 27 33 32 44 C 37 54 50 56 59 60 C 72 66 85 71 82 84 C 79 96 63 101 47 96";

export function ShuzamMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        d={MARK_PATH}
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="82" cy="38" r="8.5" fill="currentColor" />
      <circle cx="32" cy="44" r="6" fill="currentColor" />
      <circle cx="59" cy="60" r="6.5" fill="currentColor" />
      <circle cx="82" cy="84" r="6" fill="currentColor" />
      <circle cx="47" cy="96" r="8.5" fill="currentColor" />
      <line x1="88" y1="30" x2="97" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="99" cy="17.5" r="3.8" fill="currentColor" />
    </svg>
  );
}

export function ShuzamLogo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ShuzamMark className={cn("h-8 w-8 shrink-0", markClassName)} />
      <span
        className={cn(
          "font-display text-xl font-bold tracking-tight text-foreground",
          wordmarkClassName,
        )}
      >
        SHUZAM
      </span>
    </span>
  );
}
