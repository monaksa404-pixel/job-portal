import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help & Support — Job Expert" }] }),
  component: () => <DashboardLayout><HelpPage /></DashboardLayout>,
});

type Ticket = { id: string; subject: string; message: string; status: "open" | "in_progress" | "resolved"; created_at: string };

function HelpPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<Ticket[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadErr(null);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setLoadErr(error.message);
      return;
    }
    setRows((data ?? []) as Ticket[]);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`tickets-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  async function submit() {
    setMsg(null);
    if (!user) {
      setMsg("Please sign in first.");
      return;
    }
    if (!subject.trim()) {
      setMsg("Enter a subject.");
      return;
    }
    if (!message.trim()) {
      setMsg("Describe your issue in the message box.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: subject.trim(), message: message.trim(), status: "open" })
      .select("*")
      .single();
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setSubject("");
    setMessage("");
    setMsg("Ticket submitted.");
    if (data) setRows((prev) => [data as Ticket, ...prev]);
    else load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><Headphones className="w-5 h-5 text-brand-blue" /> Help & Support</h1>
      <p className="text-sm text-muted-foreground">Our team is here to help with any questions.</p>

      {loadErr && (
        <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          Could not load tickets: {loadErr}
        </div>
      )}

      <div className="mt-5 bg-white border border-border rounded-2xl p-5">
        <h2 className="font-bold text-brand-navy">Submit a Ticket</h2>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
               className="mt-3 w-full px-3 py-2 border border-border rounded-lg text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your issue (required)…"
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg text-sm" />
        <button onClick={submit} disabled={busy || !subject.trim() || !message.trim()} className="mt-3 px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-50">
          {busy ? "Submitting…" : "Submit"}
        </button>
        {msg && <div className={`mt-2 text-xs ${msg === "Ticket submitted." ? "text-emerald-700" : "text-rose-600"}`}>{msg}</div>}
      </div>

      <div className="mt-5">
        <h2 className="font-bold text-brand-navy mb-2">My Tickets</h2>
        <div className="space-y-2">
          {rows.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl py-8 text-center text-sm text-muted-foreground">No tickets yet.</div>
          ) : rows.map((t) => (
            <div key={t.id} className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-brand-navy">{t.subject}</div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue capitalize">{t.status.replace("_", " ")}</span>
              </div>
              <p className="text-sm text-foreground/70 mt-1">{t.message}</p>
              <div className="text-[11px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
