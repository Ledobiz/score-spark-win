import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketsShowcase } from "@/components/marketing/markets-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getInsights, getStats } from "@/lib/predictions/service";

export default async function Home() {
  const [stats, insights] = await Promise.all([getStats(), getInsights()]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <StatsStrip stats={stats} insights={insights} />
        <FeaturesGrid />
        <HowItWorks />
        <MarketsShowcase />
        <Pricing />
        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  );
}
