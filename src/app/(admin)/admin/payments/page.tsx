import { PaymentsPanel } from "@/components/admin/payments-panel";

export default function AdminPaymentsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Payments</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enable or disable payment gateways available to users at checkout.
      </p>
      <div className="mt-6">
        <PaymentsPanel />
      </div>
    </>
  );
}
