import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Headphones } from "lucide-react";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support Tickets — Admin" }] }),
  component: AdminSupport,
});

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
};

function AdminSupport() {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; email: string | null; phone: string | null }>>({});
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, message, status, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setRows([]);
      return;
    }
    const tickets = (data ?? []) as Ticket[];
    setRows(tickets);
    const ids = [...new Set(tickets.map((t) => t.user_id))];
    if (ids.length === 0) {
      setProfiles({});
      return;
    }
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email, phone").in("id", ids);
    const map: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};
    (profs ?? []).forEach((p: { id: string; full_name: string | null; email: string | null; phone: string | null }) => {
      map[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone };
    });
    setProfiles(map);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-support")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string, userId: string, subject: string) => {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) { setErr(error.message); return; }
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Support ticket update",
      message: `Your ticket "${subject}" is now ${status.replace("_", " ")}.`,
      type: "system",
    });
    load();
  };

  return (
    <AdminLayout title="Support Tickets" subtitle="Customer help requests from users">
      {err && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {err}
          {err.includes("support_tickets") && " — Run db/schema.sql in Supabase SQL Editor."}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-3 py-3 font-medium">Subject</th>
                <th className="text-left px-3 py-3 font-medium">Message</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-left px-3 py-3 font-medium">Date</th>
                <th className="text-left px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-10">
                    <Headphones className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No support tickets yet.
                  </td>
                </tr>
              )}
              {rows.map((t) => {
                const profile = profiles[t.user_id];
                return (
                <tr key={t.id} className="border-t border-border align-top">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy">{profile?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{profile?.phone ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3 font-medium text-brand-navy">{t.subject}</td>
                  <td className="px-3 py-3 text-foreground/80 max-w-xs">{t.message}</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-brand-blue capitalize">
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => setStatus(t.id, e.target.value, t.user_id, t.subject)}
                      className="px-2 py-1 rounded-lg border border-border text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
