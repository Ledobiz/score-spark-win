import { SiteHeader } from "@/components/shuzam/site-header";
import { Hero } from "@/components/shuzam/hero";
import { IntroSection } from "@/components/shuzam/intro-section";
import { ExploreGrid } from "@/components/shuzam/explore-grid";
import { DataVisualization } from "@/components/shuzam/data-visualization";
import { EducationSection } from "@/components/shuzam/education-section";
import { ProductPreview } from "@/components/shuzam/product-preview";
import { BrandStory } from "@/components/shuzam/brand-story";
import { CtaSection } from "@/components/shuzam/cta-section";
import { SiteFooter } from "@/components/shuzam/site-footer";
import { Pricing } from "@/components/marketing/pricing";
import { getInsights, getStats } from "@/lib/predictions/service";

export default async function Home() {
  const [stats, insights] = await Promise.all([getStats(), getInsights()]);

  return (
    <div className="theme-shuzam min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <IntroSection stats={stats} insights={insights} />
        <ExploreGrid />
        <DataVisualization />
        <EducationSection />
        <ProductPreview />
        <BrandStory />
        <Pricing />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
