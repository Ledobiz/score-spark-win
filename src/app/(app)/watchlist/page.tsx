"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardListSkeleton } from "@/components/ui/skeletons";
import type { WatchlistItem } from "@/app/api/watchlist/route";

async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch("/api/watchlist");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load watchlist");
  const data = (await res.json()) as { items: WatchlistItem[] };
  return data.items;
}

export default function WatchlistPage() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState<"team" | "league">("team");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
  });

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityName: name.trim() }),
      });
      if (!res.ok) {
        toast.error("Failed to add");
        return;
      }
      setName("");
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Favorite leagues and teams to follow closely.
      </p>

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as "team" | "league")}
            className="rounded-md border border-input bg-input px-3 text-sm"
          >
            <option value="team">Team</option>
            <option value="league">League</option>
          </select>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Add ${entityType} name...`}
            className="min-w-[200px] flex-1"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} loading={adding}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <CardListSkeleton
          count={6}
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        />
      ) : (
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Add teams or leagues you follow.
          </p>
        )}
        {items?.map((i) => (
          <Card key={i.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{i.entityName}</div>
                <div className="text-xs uppercase text-muted-foreground">
                  {i.entityType}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(i.id)}
              loading={removingId === i.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
      )}
    </>
  );
}
