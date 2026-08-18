import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Menu,
  Settings,
  Share2,
  ShieldCheck,
  Sun,
  Target,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { useNotifications, useSettings } from "@/lib/data";
import { initials } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: LucideIcon };

const ADMIN_NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/approvals", label: "Pending Approvals", icon: ShieldCheck },
  { to: "/admin/accounts", label: "Social Accounts", icon: Share2 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/audit", label: "Audit Log", icon: ClipboardList },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const CUSTOMER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "My Social Accounts", icon: Share2 },
  { to: "/analytics", label: "Growth Analytics", icon: BarChart3 },
  { to: "/reports", label: "Monthly Reports", icon: FileText },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pg-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  };
  return { dark, toggle };
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary/15 text-sidebar-primary"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  isAdmin,
  name,
  brand,
  onNavigate,
  onSignOut,
}: {
  isAdmin: boolean;
  name: string;
  brand: string;
  onNavigate?: (() => void) | undefined;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar py-5 text-sidebar-foreground">
      <Link to="/" className="mb-6 flex items-center gap-2.5 px-6" onClick={onNavigate}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-display text-base font-semibold leading-tight">{brand}</span>
          <span className="block text-[11px] uppercase tracking-wider text-sidebar-foreground/55">
            {isAdmin ? "Admin portal" : "Client portal"}
          </span>
        </span>
      </Link>
      <NavList items={isAdmin ? ADMIN_NAV : CUSTOMER_NAV} onNavigate={onNavigate} />
      <div className="mt-4 border-t border-sidebar-border px-3 pt-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {initials(name)}
          </span>
          <span className="truncate text-sm">{name}</span>
        </div>
        <button
          onClick={onSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, email } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const brand = settings?.platform_name?.trim() || "Swiiftiphones Agency";
  const { data: notifications } = useNotifications(isAdmin ? undefined : profile?.id);
  const unread = (notifications ?? []).filter((n) => !n.read).length;
  const name = profile?.full_name ?? email;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent isAdmin={isAdmin} name={name} brand={brand} onSignOut={handleSignOut} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent
                isAdmin={isAdmin}
                name={name}
                brand={brand}
                onNavigate={() => setOpen(false)}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Gauge className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <p className="truncate text-sm text-muted-foreground">
              {isAdmin ? "Portfolio overview & client management" : "Your social media performance"}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link
            to={isAdmin ? "/admin/messages" : "/notifications"}
            className="relative grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
