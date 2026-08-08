"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { json } from "@/components/admin/shared";

export function SettingsPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChangePasswordCard />
      <FixturesCacheCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      json("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    mut.mutate();
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Change password</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Updates the password for your own admin account.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <Button type="submit" loading={mut.isPending}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

function FixturesCacheCard() {
  const mut = useMutation({
    mutationFn: () => json("/api/admin/fixtures/refresh", { method: "POST" }),
    onSuccess: () => toast.success("Fixtures cache refreshed"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Fixtures cache</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Forces the prediction API to drop its cached fixtures and refetch
        from source. Use this if fixtures look stale or a league&apos;s
        schedule just changed.
      </p>
      <div className="mt-4">
        <Button
          variant="outline"
          loading={mut.isPending}
          onClick={() => mut.mutate()}
        >
          Refresh fixtures cache
        </Button>
      </div>
    </Card>
  );
}
