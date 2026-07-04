import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, FileText, MessageSquare, Settings as SettingsIcon, Headphones, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/queries";
import type { Notification, NotificationPrefs } from "@/lib/types";
import { AttachmentLink } from "@/components/AttachmentLink";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Job Expert" }] }),
  component: () => <DashboardLayout><NotificationsPage /></DashboardLayout>,
});

type Tab = "all" | "unread" | "application_update" | "job_alert";

function NotificationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setRows((data ?? []) as Notification[]);
    };
    load();
    const loadPrefs = async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setPrefs(data as NotificationPrefs);
      else {
        const def = { user_id: user.id, job_alerts: true, application_updates: true, system_updates: true };
        await supabase.from("notification_preferences").upsert(def);
        setPrefs(def as NotificationPrefs);
      }
    };
    loadPrefs();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const counts = useMemo(() => ({
    all: rows.length,
    unread: rows.filter((n) => !n.is_read).length,
    application_update: rows.filter((n) => n.type === "application_update").length,
    job_alert: rows.filter((n) => n.type === "job_alert").length,
  }), [rows]);

  const filtered = rows.filter((n) =>
    tab === "all" ? true :
    tab === "unread" ? !n.is_read :
    n.type === tab
  );

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setRows((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function setPref(key: keyof NotificationPrefs, val: boolean) {
    if (!user || !prefs) return;
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await supabase.from("notification_preferences").upsert({ ...next, user_id: user.id });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-navy">Notifications</h1>
            <p className="text-xs text-muted-foreground">Stay updated with important alerts and activities.</p>
          </div>
          <button onClick={markAllRead} className="text-sm font-semibold text-brand-blue flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Mark all as read
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <TabPill active={tab === "all"} onClick={() => setTab("all")}>All ({counts.all})</TabPill>
          <TabPill active={tab === "unread"} onClick={() => setTab("unread")}>Unread ({counts.unread})</TabPill>
          <TabPill active={tab === "application_update"} onClick={() => setTab("application_update")}>Application Updates ({counts.application_update})</TabPill>
          <TabPill active={tab === "job_alert"} onClick={() => setTab("job_alert")}>Job Alerts ({counts.job_alert})</TabPill>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : filtered.map((n) => <NotifRow key={n.id} n={n} onRead={markRead} />)}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-bold text-brand-navy flex items-center gap-2"><SettingsIcon className="w-4 h-4 text-brand-blue" /> Notification Preferences</h3>
          <p className="text-xs text-muted-foreground">Manage what you want to receive.</p>
          <div className="mt-3 space-y-3">
            <PrefRow label="Job Alerts" enabled={!!prefs?.job_alerts} onChange={(v) => setPref("job_alerts", v)} />
            <PrefRow label="Application Updates" enabled={!!prefs?.application_updates} onChange={(v) => setPref("application_updates", v)} />
            <PrefRow label="System Updates" enabled={!!prefs?.system_updates} onChange={(v) => setPref("system_updates", v)} />
          </div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 text-center">
          <Headphones className="w-8 h-8 mx-auto text-brand-blue" />
          <div className="mt-2 font-bold text-brand-navy">Need Help?</div>
          <p className="text-xs text-muted-foreground">Our support team is here to help you with any queries.</p>
          <a href="/help" className="mt-3 inline-block w-full py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold">Contact Support</a>
        </div>
      </aside>
    </div>
  );
}

function TabPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
        active ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-foreground/70 border-border hover:bg-secondary"
      }`}>
      {children}
    </button>
  );
}

function NotifRow({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const tone = n.type === "job_alert" ? { bg: "bg-blue-50", tag: "bg-blue-100 text-brand-blue", icon: FileText }
    : n.type === "application_update" ? { bg: "bg-emerald-50", tag: "bg-emerald-100 text-emerald-700", icon: MessageSquare }
    : { bg: "bg-slate-100", tag: "bg-slate-200 text-slate-700", icon: SettingsIcon };
  const Icon = tone.icon;
  return (
    <div onClick={() => !n.is_read && onRead(n.id)}
      className={`rounded-2xl border p-4 flex gap-3 cursor-pointer ${n.is_read ? "bg-white border-border" : "bg-blue-50/40 border-blue-100"}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tone.bg}`}>
        <Icon className="w-5 h-5 text-brand-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tone.tag}`}>
            {n.type === "job_alert" ? "Job Alert" : n.type === "application_update" ? "Application Update" : "System"}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatRelative(n.created_at)}</span>
        </div>
        <div className="mt-1 font-semibold text-brand-navy text-sm">{n.title}</div>
        <p className="text-xs text-foreground/70 mt-0.5">{n.message}</p>
        {n.attachment_url && <AttachmentLink path={n.attachment_url} name={n.attachment_name} />}
      </div>
      {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-blue mt-2" />}
    </div>
  );
}

function PrefRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <div className="font-semibold text-brand-navy">{label}</div>
        <div className="text-[11px] text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</div>
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition ${enabled ? "bg-brand-blue" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 ${enabled ? "right-0.5" : "left-0.5"} w-4 h-4 rounded-full bg-white`} />
      </button>
    </div>
  );
}