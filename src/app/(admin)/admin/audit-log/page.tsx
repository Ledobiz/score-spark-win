import { AuditLogPanel } from "@/components/admin/audit-log-panel";

export default function AdminAuditLogPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Audit log</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every admin action, platform-wide — plan changes, trials, cancellations,
        and deletions.
      </p>
      <div className="mt-6">
        <AuditLogPanel />
      </div>
    </>
  );
}
