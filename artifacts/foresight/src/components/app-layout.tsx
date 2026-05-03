import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Radio,
  TrendingUp,
  Folder,
  Map as MapIcon,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    queryClient.clear();
    setLocation("/");
  };

  const navItems =
    user?.role === "instructor"
      ? [
          { label: "Dashboard", href: "/instructor", icon: LayoutDashboard },
          { label: "Signals", href: "/signals", icon: Radio },
          { label: "Trends", href: "/trends", icon: TrendingUp },
          { label: "Scenarios", href: "/scenarios", icon: MapIcon },
          { label: "Settings", href: "/instructor/settings", icon: Settings },
        ]
      : [
          { label: "Home", href: "/home", icon: BookOpen },
          { label: "Signals", href: "/signals", icon: Radio },
          { label: "Trends", href: "/trends", icon: TrendingUp },
          { label: "Collections", href: "/collections", icon: Folder },
          { label: "Scenarios", href: "/scenarios", icon: MapIcon },
        ];

  const sidebarWidth = collapsed ? "md:w-16" : "md:w-64";

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4">
        <Link href={user?.role === "instructor" ? "/instructor" : "/home"}>
          <span className="font-serif text-lg font-bold text-primary inline-flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Foresight
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-40 bg-foreground/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (desktop persistent / mobile drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 transform transition-all duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          w-64 ${sidebarWidth} border-r border-border bg-sidebar flex flex-col`}
      >
        <div
          className={`p-4 border-b border-border flex items-center ${
            collapsed ? "md:justify-center" : "justify-between"
          }`}
        >
          <Link href={user?.role === "instructor" ? "/instructor" : "/home"}>
            <h1
              className={`font-serif text-xl font-bold text-primary inline-flex items-center gap-2 ${
                collapsed ? "md:sr-only" : ""
              }`}
            >
              <BookOpen className="w-6 h-6 shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>
                Foresight Studio
              </span>
            </h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        <nav
          aria-label="Primary"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    collapsed ? "md:justify-center" : ""
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={collapsed ? "md:hidden" : ""}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border bg-sidebar-accent/30">
          <div
            className={`flex items-center ${
              collapsed ? "md:justify-center" : "justify-between"
            } gap-2`}
          >
            <div className={collapsed ? "md:hidden" : ""}>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Primary mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur flex justify-around"
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
