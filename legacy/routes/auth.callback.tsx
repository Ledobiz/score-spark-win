import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({ component: Callback });

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      navigate({ to: data.session ? "/onboarding" : "/auth", replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [navigate]);
  return <div className="grid min-h-screen place-items-center text-muted-foreground">Completing sign-in…</div>;
}
