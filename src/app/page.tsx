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

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "SHUZAM",
      // alternateName: "Ledobiz Technologies Limited",
      url: "https://shuzam.com",
      logo: "https://shuzam.com/brand/shuzam-mark-512.png",
    },
    {
      "@type": "WebSite",
      name: "SHUZAM",
      url: "https://shuzam.com",
      description:
        "SHUZAM is a sports intelligence and analytics platform that helps you understand the game through data, statistics, and intelligent analysis.",
    },
  ],
};

export default async function Home() {
  const [stats, insights] = await Promise.all([getStats(), getInsights()]);

  return (
    <div className="theme-shuzam min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
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
