import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Star, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/watchlist")({ component: WatchlistPage });

function WatchlistPage() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState<"team" | "league">("team");
  const [name, setName] = useState("");

  const { data: items } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      return (await supabase.from("watchlist").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false })).data ?? [];
    },
  });

  const add = async () => {
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("watchlist").insert({ user_id: u.user!.id, entity_type: entityType, entity_name: name.trim() });
    if (error) return toast.error(error.message);
    setName(""); qc.invalidateQueries({ queryKey: ["watchlist"] });
  };
  const remove = async (id: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">Favorite leagues and teams to follow closely.</p>

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap gap-2">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value as "team" | "league")}
            className="rounded-md border border-input bg-input px-3 text-sm">
            <option value="team">Team</option><option value="league">League</option>
          </select>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${entityType} name...`} className="flex-1 min-w-[200px]" onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet. Add teams or leagues you follow.</p>}
        {items?.map((i) => (
          <Card key={i.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{i.entity_name}</div>
                <div className="text-xs uppercase text-muted-foreground">{i.entity_type}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
