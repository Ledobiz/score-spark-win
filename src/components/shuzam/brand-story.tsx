import { Reveal } from "@/components/marketing/reveal";
import { ShuzamMark } from "@/components/shuzam/logo";

export function BrandStory() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <ShuzamMark className="mx-auto h-10 w-10 text-[#111a2e]" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Why SHUZAM?
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            &ldquo;Choose am&rdquo; — choose it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            The name comes from the Nigerian Pidgin expression <em>&ldquo;choose am&rdquo;</em> —
            choose it. We transformed that phrase into SHUZAM to represent a simple idea: when you
            understand the data, you can make more informed choices.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
