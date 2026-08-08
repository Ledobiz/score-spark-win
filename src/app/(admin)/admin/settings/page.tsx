import { SettingsPanel } from "@/components/admin/settings-panel";

export default function AdminSettingsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your admin account and platform system controls.
      </p>
      <div className="mt-6">
        <SettingsPanel />
      </div>
    </>
  );
}
