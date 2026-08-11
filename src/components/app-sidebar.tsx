"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  History,
  LayoutDashboard,
  Layers,
  LineChart,
  LogOut,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useIsAdmin } from "@/lib/use-is-admin";
import { ShuzamMark } from "@/components/shuzam/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predictions", label: "Predictions", icon: Sparkles },
  { to: "/accumulator", label: "Accumulator", icon: Layers },
  { to: "/history", label: "History", icon: History },
  { to: "/insights", label: "Insights", icon: LineChart },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`);

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false);
  };

  const signOut = async () => {
    closeMobileMenu();
    await queryClient.cancelQueries();
    queryClient.clear();
    await nextAuthSignOut({ redirect: false });
    router.replace("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 px-2 py-1 font-display text-lg font-bold"
        >
          <ShuzamMark className="h-8 w-8 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">
            SHUZAM
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => (
                <SidebarMenuItem key={n.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(n.to)}
                    tooltip={n.label}
                  >
                    <Link href={n.to} onClick={closeMobileMenu}>
                      <n.icon />
                      <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isAdmin && (
          <>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Admin panel">
                  <Link href="/admin" onClick={closeMobileMenu}>
                    <Shield />
                    <span>Admin panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator />
          </>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
