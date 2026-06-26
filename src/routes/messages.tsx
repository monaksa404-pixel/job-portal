import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Job Expert" }] }),
  component: () => <DashboardLayout><MessagesPage /></DashboardLayout>,
});

type Msg = { id: string; user_id: string; title: string | null; message: string; is_read: boolean; created_at: string };

function MessagesPage() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("messages").select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMsgs((data ?? []) as Msg[]);
      await supabase.from("messages").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    };
    load();
    const ch = supabase.channel(`msg-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><MessageSquare className="w-5 h-5 text-brand-blue" /> Messages</h1>
      <p className="text-sm text-muted-foreground">Messages from the Job Expert team. To reply, please open a support ticket.</p>

      <div className="mt-4 space-y-3">
        {msgs.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center text-sm text-muted-foreground">
            No messages yet.
          </div>
        ) : msgs.map((m) => (
          <div key={m.id} className={`rounded-2xl border p-4 ${m.is_read ? "bg-white border-border" : "bg-blue-50/40 border-blue-100"}`}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-brand-navy">{m.title ?? "Message"}</div>
              <span className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-line">{m.message}</p>
          </div>
        ))}
        <Link to="/help" className="inline-block text-sm font-semibold text-brand-blue">Need to reply? Open a support ticket →</Link>
      </div>
    </div>
  );
}