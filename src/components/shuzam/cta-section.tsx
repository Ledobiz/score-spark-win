import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaSection() {
  return (
    <section className="shuzam-dark relative overflow-hidden bg-background py-20 sm:py-28">
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[130px]"
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">See the game differently.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Explore sports through data, analysis, and insight.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="group font-semibold">
                Explore SHUZAM
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
