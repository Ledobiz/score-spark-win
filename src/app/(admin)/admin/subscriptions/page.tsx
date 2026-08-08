import { SubscriptionsPanel } from "@/components/admin/subscriptions-panel";

export default function AdminSubscriptionsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Subscriptions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the plan catalog — pricing, limits, and availability.
      </p>
      <div className="mt-6">
        <SubscriptionsPanel />
      </div>
    </>
  );
}
