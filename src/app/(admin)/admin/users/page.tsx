import { UsersPanel } from "@/components/admin/users-panel";

export default function AdminUsersPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Users</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Search, filter, and manage individual accounts.
      </p>
      <div className="mt-6">
        <UsersPanel />
      </div>
    </>
  );
}
