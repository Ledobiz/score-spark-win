"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { useHasMounted } from "@/lib/use-has-mounted";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <SidebarTrigger />
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
            <p className="font-semibold text-foreground">18+ Responsible Gambling</p>
            <p className="mt-1">
              Predictions are informational, not guarantees. Never bet more than you
              can afford to lose. If gambling is a problem, seek help.
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
