import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Job Expert" }] }),
  component: () => <DashboardLayout><MessagesPage /></DashboardLayout>,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; is_read: boolean };

function MessagesPage() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      setMsgs((data ?? []) as Msg[]);
      await supabase.from("messages").update({ is_read: true }).eq("recipient_id", user.id).eq("is_read", false);
    };
    load();
    const ch = supabase.channel(`msg-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    if (!user || !text.trim()) return;
    await supabase.from("messages").insert({ sender_id: user.id, recipient_id: user.id, body: text.trim() });
    setText("");
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><MessageSquare className="w-5 h-5 text-brand-blue" /> Messages</h1>
      <p className="text-sm text-muted-foreground">Communication with the Job Expert team.</p>

      <div className="mt-4 bg-white border border-border rounded-2xl flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {msgs.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">No messages yet.</div>
          ) : msgs.map((m) => {
            const me = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${me ? "ml-auto bg-brand-blue text-white" : "bg-secondary text-brand-navy"}`}>
                {m.body}
                <div className={`text-[10px] mt-0.5 ${me ? "text-white/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border p-2 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                 placeholder="Type a message…"
                 className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
          <button onClick={send} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold flex items-center gap-1"><Send className="w-4 h-4" /> Send</button>
        </div>
      </div>
    </div>
  );
}