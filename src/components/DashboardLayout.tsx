import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Heart, CreditCard, User, MessageSquare,
  Bell, FileText, Settings, LifeBuoy, LogOut, FileCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { profileCompleteness, type Profile } from "@/lib/types";

const items = [
  { to: "/dashboard",        label: "Dashboard",      icon: LayoutDashboard },
  { to: "/my-applications",  label: "My Applications", icon: Briefcase },
  { to: "/saved-jobs",       label: "Saved Jobs",      icon: Heart },
  { to: "/payments",         label: "Payments",        icon: CreditCard },
  { to: "/profile",          label: "Profile",         icon: User },
  { to: "/messages",         label: "Messages",        icon: MessageSquare },
  { to: "/notifications",    label: "Notifications",   icon: Bell },
  { to: "/my-documents",     label: "My Documents",    icon: FileText },
  { to: "/settings",         label: "Settings",        icon: Settings },
  { to: "/help",             label: "Help & Support",  icon: LifeBuoy },
] as const;

export function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
    const loadUnread = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("is_read", false);
      setUnread(count ?? 0);
    };
    loadUnread();
    const ch = supabase.channel(`notif-count-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, loadUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: pathname } });
  }, [loading, user, pathname, navigate]);

  if (loading || !user) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const completeness = profileCompleteness(profile);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6 min-w-0 overflow-x-clip">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col gap-2 sticky top-24 self-start">
          <nav className="bg-white border border-border rounded-2xl p-2">
            {items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.to;
              return (
                <Link key={it.to} to={it.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    active ? "bg-brand-blue text-white" : "text-foreground/80 hover:bg-secondary"
                  }`}>
                  <Icon className="w-4 h-4" /> {it.label}
                  {it.to === "/notifications" && unread > 0 && (
                    <span className={`ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5 ${active ? "bg-white text-brand-blue" : "bg-rose-500 text-white"}`}>{unread}</span>
                  )}
                </Link>
              );
            })}
            <button onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </nav>

          <div className="bg-white border border-border rounded-2xl p-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-brand-blue" />
            </div>
            <div className="mt-3 font-bold text-brand-navy text-sm">Complete Your Profile</div>
            <div className="text-[11px] text-muted-foreground">Increase your chances of getting hired</div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-muted-foreground">{completeness}% Complete</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-brand-blue" style={{ width: `${completeness}%` }} />
            </div>
            <Link to="/profile" className="mt-3 block w-full py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold">
              Complete Now
            </Link>
          </div>
        </aside>

        {/* Content */}
        <section className="min-w-0">
          {title && <h1 className="text-2xl font-extrabold text-brand-navy mb-4 lg:hidden">{title}</h1>}
          {children}
        </section>
      </div>
    </div>
  );
}