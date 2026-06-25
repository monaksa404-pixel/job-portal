import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "./index";
import { formatRelative } from "@/lib/queries";

type N = { id: string; title: string; body: string; read: boolean; created_at: string };

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Job Expert" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [rows, setRows] = useState<N[] | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!u.user) { setLoggedIn(false); return; }
      setLoggedIn(true);
      const uid = u.user.id;

      const load = async () => {
        const { data } = await supabase
          .from("notifications")
          .select("id, title, body, read, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });
        if (mounted) setRows((data ?? []) as N[]);
      };
      await load();

      channel = supabase
        .channel("user-notifications")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          load)
        .subscribe();
    })();
    return () => { mounted = false; if (channel) supabase.removeChannel(channel); };
  }, []);

  if (loggedIn === false) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-xl font-bold text-brand-navy">Sign in required</h1>
        <p className="text-sm text-muted-foreground mt-1">Please sign in to view your notifications.</p>
        <Link to="/auth" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
        <Bell className="w-5 h-5 text-brand-blue" /> Notifications
      </h1>
      <div className="mt-6 space-y-3">
        {rows === null ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No notifications" note="You're all caught up." />
        ) : rows.map((n) => (
          <div key={n.id} className={`rounded-2xl border p-4 ${n.read ? "bg-white border-border" : "bg-blue-50/40 border-blue-100"}`}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-brand-navy">{n.title}</div>
              <div className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</div>
            </div>
            <p className="text-sm text-foreground/80 mt-1">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}