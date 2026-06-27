import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, X, Download, Send } from "lucide-react";

export const Route = createFileRoute("/admin/applications/$id")({
  head: () => ({ meta: [{ title: "Application — Admin" }] }),
  component: AppDetail,
});

type Full = {
  id: string; application_id: string; created_at: string; payment_status: string; application_status: string;
  user_id: string; experience: string | null; recharge_pin: string | null; cv_url: string | null; passport_url: string | null;
  job: { title: string; location: string | null; application_fee: number | null; company: { name: string; logo_url: string | null } | null } | null;
  profile: { full_name: string | null; phone: string | null; email: string | null; nationality: string | null; country: string | null; gender: string | null } | null;
};

function AppDetail() {
  const { id } = Route.useParams();
  const [a, setA] = useState<Full | null>(null);
  const [msg, setMsg] = useState(""); const [popup, setPopup] = useState({ title: "", message: "" });

  const load = async () => {
    const { data } = await supabase.from("applications").select("*, job:jobs(title, location, application_fee, company:companies(name, logo_url)), profile:profiles!applications_user_id_fkey(full_name, phone, email, nationality, country, gender)").eq("id", id).maybeSingle();
    setA(data as unknown as Full);
  };
  useEffect(() => { load(); }, [id]);

  const setStatus = async (s: "accepted" | "rejected" | "shortlisted" | "under_review") => {
    if (!a) return;
    await supabase.from("applications").update({ application_status: s }).eq("id", a.id);
    await supabase.from("notifications").insert({ user_id: a.user_id, title: `Application ${s.replace("_"," ")}`, message: `Your application for ${a.job?.title ?? ""} is now ${s.replace("_"," ")}.`, type: s });
    load();
  };
  const verify = async (ok: boolean) => {
    if (!a) return;
    await supabase.from("applications").update({ payment_status: ok ? "verified" : "rejected" }).eq("id", a.id);
    await supabase.from("notifications").insert({ user_id: a.user_id, title: `Payment ${ok ? "Verified" : "Rejected"}`, message: ok ? "STC recharge pin verified." : "STC recharge pin rejected.", type: ok ? "accepted" : "rejected" });
    load();
  };
  const sendMessage = async () => {
    if (!a || !msg.trim()) return;
    await supabase.from("messages").insert({ user_id: a.user_id, application_id: a.id, body: msg.trim() });
    await supabase.from("notifications").insert({ user_id: a.user_id, title: "New message", message: msg.trim().slice(0, 120), type: "info" });
    setMsg("");
  };
  const sendPopup = async () => {
    if (!a || !popup.message.trim()) return;
    await supabase.from("popups").insert({ user_id: a.user_id, title: popup.title || "Notice", message: popup.message.trim() });
    setPopup({ title: "", message: "" });
  };

  if (!a) return <AdminLayout title="Application"><div className="text-sm text-muted-foreground">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title={`Application ${a.application_id}`} subtitle={a.job?.title ?? ""}>
      <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm text-brand-blue mb-4"><ArrowLeft className="w-4 h-4" /> Back to applications</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Applicant</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Full Name" v={a.profile?.full_name} />
              <Info label="WhatsApp" v={a.profile?.phone} />
              <Info label="Email" v={a.profile?.email} />
              <Info label="Nationality" v={a.profile?.nationality} />
              <Info label="Country" v={a.profile?.country} />
              <Info label="Gender" v={a.profile?.gender} />
              <Info label="Experience" v={a.experience ?? "—"} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Documents</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <DocLink label="CV" url={a.cv_url} />
              <DocLink label="Passport" url={a.passport_url} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Payment</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Application Fee" v={a.job?.application_fee ? `${a.job.application_fee} SAR` : "Free"} />
              <Info label="Status" v={a.payment_status} />
              <Info label="STC Recharge PIN" v={a.recharge_pin ?? "—"} mono />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => verify(true)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Verify Payment</button>
              <button onClick={() => verify(false)} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold inline-flex items-center gap-1"><X className="w-4 h-4" /> Reject Payment</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Application Decision</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setStatus("accepted")} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Accept</button>
              <button onClick={() => setStatus("rejected")} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold">Reject</button>
              <button onClick={() => setStatus("shortlisted")} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold">Shortlist</button>
              <button onClick={() => setStatus("under_review")} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold">Under Review</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Send Message</div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Custom message…" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <button onClick={sendMessage} className="mt-2 w-full inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold"><Send className="w-4 h-4" /> Send</button>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Send Popup</div>
            <input value={popup.title} onChange={(e) => setPopup({ ...popup, title: e.target.value })} placeholder="Title" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <textarea value={popup.message} onChange={(e) => setPopup({ ...popup, message: e.target.value })} rows={3} placeholder="Popup body…" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <button onClick={sendPopup} className="mt-2 w-full py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">Show Popup to User</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, v, mono }: { label: string; v: string | null | undefined; mono?: boolean }) {
  return <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className={`text-sm font-semibold text-brand-navy ${mono ? "font-mono" : ""}`}>{v ?? "—"}</div></div>;
}
function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return <div className="border border-border rounded-lg p-3 text-sm text-muted-foreground">{label}: Not uploaded</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="border border-border rounded-lg p-3 text-sm flex items-center justify-between hover:bg-secondary">
      <span className="font-semibold text-brand-navy">{label}</span>
      <Download className="w-4 h-4 text-brand-blue" />
    </a>
  );
}
