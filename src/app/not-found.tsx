import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShuzamLogo } from "@/components/shuzam/logo";
import { getAuthedUser } from "@/lib/auth/server";

export default async function NotFound() {
  const user = await getAuthedUser();
  const homeHref = user ? "/dashboard" : "/";

  return (
    <div className="theme-shuzam shuzam-dark relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute bottom-0 right-0 h-[380px] w-[480px] rounded-full bg-chart-3/15 blur-[110px] [animation-delay:-6s]"
      />

      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link href={homeHref} className="inline-flex">
          <ShuzamLogo />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
          <Search className="h-3.5 w-3.5" />
          Error 404
        </span>

        <h1 className="text-gradient-shuzam mt-6 font-display text-[5.5rem] font-bold leading-none tracking-tight sm:text-[8rem]">
          404
        </h1>

        <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">
          Offside — this page doesn&apos;t exist.
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for was moved, renamed, or never made
          the squad. Let&apos;s get you back on pitch.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={homeHref}>
            <Button size="lg" className="glow-accent w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              {user ? "Back to dashboard" : "Back to home"}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
