"use client";

import { useEffect } from "react";
import { Inter, Space_Grotesk, Sora } from "next/font/google";
import { AlertOctagon, RotateCw } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

export default function GlobalError({
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
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${sora.variable}`}
    >
      <body className="antialiased">
        <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 text-center text-foreground">
          <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div
            aria-hidden="true"
            className="animate-aurora pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-destructive/15 blur-[120px]"
          />

          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
              <AlertOctagon className="h-3.5 w-3.5 text-destructive" />
              Critical error
            </span>

            <h1 className="text-gradient-shuzam mt-6 font-display text-[4.5rem] font-bold leading-none tracking-tight sm:text-[6.5rem]">
              500
            </h1>

            <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">
              SHUZAM hit a wall.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              The app failed to load. This has been logged — try reloading
              the page in a moment.
            </p>

            <button
              onClick={() => reset()}
              className="glow-accent mt-8 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <RotateCw className="h-4 w-4" />
              Reload
            </button>

            {error.digest && (
              <p className="mt-6 font-mono text-xs text-muted-foreground/70">
                Reference: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
