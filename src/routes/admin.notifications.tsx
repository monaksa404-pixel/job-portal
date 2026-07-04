import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminUsers } from "@/lib/admin-users";
import { uploadAdminAttachment } from "@/lib/storage-url";
import { Send, MessageSquare, Bell, AlertCircle, Paperclip } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Send Notifications — Admin" }] }),
  component: AdminNotifications,
});

type Profile = { id: string; full_name: string | null; email: string | null };
type Tab = "notification" | "message" | "popup";

function AdminNotifications() {
  const [tab, setTab] = useState<Tab>("notification");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<{ title: string; message: string; created_at: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    const merged = await fetchAdminUsers();
    setUsers(merged.map((u) => ({ id: u.id, full_name: u.full_name, email: u.email })));
  };

  useEffect(() => {
    loadUsers();
    supabase.from("notifications").select("title, message, created_at").order("created_at", { ascending: false }).limit(10).then(({ data }) => setRecent((data ?? []) as typeof recent));
  }, []);

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const send = async () => {
    setErr(null);
    setOk(null);
    if (!message.trim()) { setErr("Message required"); return; }
    const targets = allUsers ? users.map((u) => u.id) : Array.from(selected);
    if (targets.length === 0) { setErr("Select at least one user"); return; }
    setSending(true);

    const basePayload = {
      title: title || (tab === "message" ? "Message from Admin" : tab === "popup" ? "Notice" : "Notification"),
      message: message.trim(),
    };

    if (tab === "popup") {
      const rows = targets.map((id) => ({ user_id: id, title: basePayload.title, message: basePayload.message }));
      const { error } = await supabase.from("popups").insert(rows);
      if (error) { setErr(error.message); setSending(false); return; }
    } else {
      for (const id of targets) {
        let attachment_url: string | null = null;
        let attachment_name: string | null = null;
        if (attachFile) {
          try {
            const uploaded = await uploadAdminAttachment(id, attachFile);
            attachment_url = uploaded.path;
            attachment_name = uploaded.name;
          } catch {
            setErr("Failed to upload attachment.");
            setSending(false);
            return;
          }
        }
        if (tab === "notification") {
          const { error } = await supabase.from("notifications").insert({
            user_id: id,
            title: basePayload.title,
            message: basePayload.message,
            type: "system",
            attachment_url,
            attachment_name,
          });
          if (error) { setErr(error.message); setSending(false); return; }
        } else {
          const { error } = await supabase.from("messages").insert({
            user_id: id,
            title: basePayload.title,
            message: basePayload.message,
            attachment_url,
            attachment_name,
          });
          if (error) { setErr(error.message); setSending(false); return; }
        }
      }
    }

    setOk(`Sent to ${targets.length} user(s).`);
    setMessage("");
    setTitle("");
    setAttachFile(null);
    setSelected(new Set());
    if (fileRef.current) fileRef.current.value = "";
    setSending(false);
    setTimeout(() => setOk(null), 3000);
    const { data } = await supabase.from("notifications").select("title, message, created_at").order("created_at", { ascending: false }).limit(10);
    setRecent((data ?? []) as typeof recent);
  };

  const tabs: { k: Tab; label: string; icon: typeof Bell }[] = [
    { k: "notification", label: "Notification", icon: Bell },
    { k: "message", label: "Message", icon: MessageSquare },
    { k: "popup", label: "Popup", icon: AlertCircle },
  ];

  return (
    <AdminLayout title="Send Notifications" subtitle="Push notifications, messages and popups to users">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${active ? "bg-brand-blue text-white" : "text-muted-foreground hover:bg-secondary"}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {err && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{err}</div>}
          {ok && <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2">{ok}</div>}

          {tab !== "message" && (
            <>
              <label className="text-xs font-bold mt-4 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </>
          )}

          <label className="text-xs font-bold mt-3 block">Message *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Type your message…" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />

          {tab !== "popup" && (
            <>
              <label className="text-xs font-bold mt-3 block">Attach File <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1 w-full border-2 border-dashed border-border rounded-xl py-4 text-center text-xs text-muted-foreground hover:bg-secondary/40 transition"
              >
                <Paperclip className="w-5 h-5 mx-auto" />
                <div className="mt-1 font-semibold text-brand-navy">{attachFile ? attachFile.name : "Click to upload document or image"}</div>
                <div>PDF, DOC, DOCX, PNG, JPG (Max 10MB)</div>
              </button>
            </>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label className="text-sm font-semibold flex items-center gap-2">
              <input type="checkbox" checked={allUsers} onChange={(e) => setAllUsers(e.target.checked)} />
              Send to all users ({users.length})
            </label>
            <button onClick={send} disabled={sending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-60">
              <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send"}
            </button>
          </div>

          {!allUsers && (
            <div className="mt-4 max-h-80 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {users.map((u) => {
                const on = selected.has(u.id);
                return (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
                    <input type="checkbox" checked={on} onChange={() => toggle(u.id)} />
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold flex items-center justify-center">{(u.full_name ?? u.email ?? "U").slice(0, 1).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-navy truncate">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-bold text-brand-navy">Recent Notifications</div>
          <div className="mt-3 space-y-3">
            {recent.length === 0 && <div className="text-sm text-muted-foreground">No notifications yet</div>}
            {recent.map((r, i) => (
              <div key={i} className="border border-border rounded-xl p-3">
                <div className="text-sm font-semibold text-brand-navy">{r.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{r.message}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
