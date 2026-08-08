import { OverviewPanel } from "@/components/admin/overview-panel";

export default function AdminDashboardPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform KPIs — users, revenue, and subscription health.
      </p>
      <div className="mt-6">
        <OverviewPanel />
      </div>
    </>
  );
}
