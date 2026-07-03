import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, X, LayoutDashboard, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/jobs", label: "Jobs" },
  { to: "/my-applications", label: "My Applications" },
  { to: "/notifications", label: "Notifications" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel(`hdr-notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const name = (user?.user_metadata as { full_name?: string } | undefined)?.full_name || user?.email?.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6 h-28 sm:h-32 md:h-36 lg:h-40 flex items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative text-sm font-medium transition-colors ${
                  active ? "text-brand-blue" : "text-foreground/80 hover:text-brand-blue"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-brand-blue rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-secondary" aria-label="Notifications">
                <Bell className="w-5 h-5 text-brand-navy" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
                )}
              </Link>
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-brand-navy">{name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-border rounded-xl shadow-lg p-1.5 z-50" onMouseLeave={() => setMenuOpen(false)}>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary"><LayoutDashboard className="w-4 h-4"/> Dashboard</Link>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary"><User className="w-4 h-4"/> Profile</Link>
                    <button onClick={async () => { await supabase.auth.signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"><LogOut className="w-4 h-4"/> Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="px-5 py-2 text-sm font-semibold text-brand-blue border-2 border-brand-blue rounded-lg hover:bg-brand-blue hover:text-white transition">Login</Link>
              <Link to="/auth" className="px-5 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:opacity-90 transition">Register</Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-brand-navy" />}
        </button>
        <Link to="/notifications" className="lg:hidden relative p-2" aria-label="Notifications">
          <Bell className="w-5 h-5 text-brand-navy" />
          {unread > 0 && (
            <span className="absolute top-0 right-0 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>
          )}
        </Link>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-blue text-center"
            >
              Login / Register
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}