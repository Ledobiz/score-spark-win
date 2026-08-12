"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShuzamLogo } from "@/components/shuzam/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="theme-shuzam shuzam-dark relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-destructive/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute bottom-0 right-0 h-[380px] w-[480px] rounded-full bg-primary/15 blur-[110px] [animation-delay:-6s]"
      />

      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link href="/" className="inline-flex">
          <ShuzamLogo />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          Error 500
        </span>

        <h1 className="text-gradient-shuzam mt-6 font-display text-[5.5rem] font-bold leading-none tracking-tight sm:text-[8rem]">
          500
        </h1>

        <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">
          Something went wrong on our end.
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Our analysis engine hit an unexpected snag. It&apos;s not
          something you did — try again, and if it keeps happening, head
          back home.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="glow-accent w-full sm:w-auto" onClick={() => reset()}>
            <RotateCw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
      </main>
    </div>
  );
}
