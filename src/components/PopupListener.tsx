import { useEffect, useState } from "react";
import { Briefcase, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Popup } from "@/lib/types";

export function PopupListener() {
  const { user } = useAuth();
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("popups").select("*")
        .eq("user_id", user.id).eq("is_viewed", false)
        .order("created_at", { ascending: false }).limit(1);
      if (data && data[0]) setPopup(data[0] as Popup);
    };
    load();
    const ch = supabase.channel(`popups-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "popups", filter: `user_id=eq.${user.id}` },
        (payload) => setPopup(payload.new as Popup))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  async function dismiss() {
    if (!popup) return;
    await supabase.from("popups").update({ is_viewed: true }).eq("id", popup.id);
    setPopup(null);
  }

  if (!popup) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-2xl">
        <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary">
          <X className="w-4 h-4" />
        </button>
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-blue flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-brand-navy">{popup.title || "Good News!"}</h2>
        <p className="mt-2 text-sm text-foreground/80">{popup.message}</p>
        <div className="mt-5 flex gap-3">
          <Link to="/my-applications" onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm">
            View Details
          </Link>
          <button onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm text-brand-navy">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}