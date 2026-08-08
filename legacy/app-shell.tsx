import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Shield, Sun, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/use-is-admin";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/predictions", label: "Predictions" },
  { to: "/accumulator", label: "Accumulator" },
  { to: "/history", label: "History" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  const { data: isAdmin } = useIsAdmin();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-4 w-4" /></span>
            <span>PredictPro</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground" activeProps={{ className: "active" }}>
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-primary hover:bg-secondary [&.active]:bg-secondary" activeProps={{ className: "active" }}>
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground" activeProps={{ className: "active" }}>
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="whitespace-nowrap rounded-md px-3 py-1 text-xs text-primary [&.active]:bg-secondary" activeProps={{ className: "active" }}>
              Admin
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="mt-12 border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p className="font-semibold text-foreground">18+ Responsible Gambling</p>
          <p className="mt-1">Predictions are informational, not guarantees. Never bet more than you can afford to lose. If gambling is a problem, seek help.</p>
        </div>
      </footer>
    </div>
  );
}
