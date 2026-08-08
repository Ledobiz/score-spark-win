import { AnalyticsPanel } from "@/components/admin/analytics-panel";

export default function AdminAnalyticsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Analytics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform-wide usage, subscriptions, and recent activity.
      </p>
      <div className="mt-6">
        <AnalyticsPanel />
      </div>
    </>
  );
}
