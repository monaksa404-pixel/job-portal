import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, FileText, Users, Building2, Tag,
  Bell, Mail, Settings, BarChart3, CreditCard, LogOut, Menu, X, BadgeCheck, LifeBuoy, FolderOpen,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/admin/dashboard",     label: "Dashboard",            icon: LayoutDashboard },
  { to: "/admin/jobs",          label: "Job Management",       icon: Briefcase },
  { to: "/admin/applications",  label: "Applications",         icon: FileText },
  { to: "/admin/documents",      label: "User Applications",    icon: FolderOpen },
  { to: "/admin/support",       label: "Support Tickets",      icon: LifeBuoy },
  { to: "/admin/users",         label: "Users",                icon: Users },
  { to: "/admin/categories",    label: "Categories",           icon: Tag },
  { to: "/admin/companies",     label: "Companies",            icon: Building2 },
  { to: "/admin/notifications", label: "Notifications",        icon: Bell },
  { to: "/admin/messages",      label: "Email Templates",      icon: Mail },
  { to: "/admin/settings",      label: "Settings",             icon: Settings },
  { to: "/admin/reports",       label: "Reports",              icon: BarChart3 },
  { to: "/admin/payments",      label: "Payment Transactions", icon: CreditCard },
] as const;

export function AdminLayout({ children, title, subtitle, actions }: {
  children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode;
}) {
  const { user, isAdmin, loading } = useAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/admin/login" }); return; }
    if (isAdmin === false) { navigate({ to: "/admin/login" }); }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const { count } = await supabase.from("applications")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "pending");
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("admin-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading admin…</div>;
  }

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); };

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo imgClassName="h-11 w-auto object-contain" />
            <span className="text-[10px] uppercase tracking-wider text-brand-yellow font-bold -ml-1">Admin Panel</span>
          </div>
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <Link key={it.to} to={it.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? "bg-brand-blue text-white" : "text-white/80 hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4" /> <span className="flex-1">{it.label}</span>
                {it.to === "/admin/applications" && unread > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-navy font-bold flex items-center justify-center text-sm">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">Admin User</div>
              <div className="text-[11px] text-white/60 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</div>
            </div>
          </div>
          <button onClick={signOut} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border flex flex-wrap items-center px-3 sm:px-4 lg:px-8 gap-2 sm:gap-3 py-2.5 lg:py-0 lg:h-16 lg:flex-nowrap">
          <button className="lg:hidden p-2 shrink-0" onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5 text-brand-navy" /></button>
          <div className="flex-1 min-w-0 order-2 lg:order-none basis-[calc(100%-3rem)] lg:basis-auto">
            {title && <div className="font-extrabold text-brand-navy text-sm sm:text-base lg:text-lg leading-tight break-words">{title}</div>}
            {subtitle && <div className="text-[11px] sm:text-xs text-muted-foreground break-words">{subtitle}</div>}
          </div>
          {actions && <div className="order-4 lg:order-none w-full sm:w-auto min-w-0 shrink">{actions}</div>}
          <Link to="/admin/notifications" className="relative p-2 rounded-full hover:bg-secondary shrink-0 order-3 lg:order-none ml-auto lg:ml-0">
            <Bell className="w-5 h-5 text-brand-navy" />
            {unread > 0 && <span className="absolute top-0 right-0 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-secondary">
            <div className="w-8 h-8 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="text-sm font-semibold text-brand-navy flex items-center gap-1">Admin User <BadgeCheck className="w-4 h-4 text-brand-blue" /></div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-8 min-w-0 overflow-x-clip">{children}</main>
      </div>
    </div>
  );
}
