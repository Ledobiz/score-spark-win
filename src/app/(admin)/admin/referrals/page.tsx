import { ReferralsPanel } from "@/components/admin/referrals-panel";

export default function AdminReferralsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Referrals</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Points earned and redeemed platform-wide. Edit &quot;referrals per point&quot;
        for a plan from the Subscriptions tab.
      </p>
      <div className="mt-6">
        <ReferralsPanel />
      </div>
    </>
  );
}
