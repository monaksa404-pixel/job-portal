import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_APPLICATION_DETAIL_SELECT } from "@/lib/admin-applications";
import { getApplicationDocUrl, getDocumentSignedUrl, uploadAdminAttachment } from "@/lib/storage-url";
import { AdminToast, AdminSpinner } from "@/components/admin/AdminToast";
import { ArrowLeft, Check, X, Download, Send, Paperclip } from "lucide-react";

export const Route = createFileRoute("/admin/applications/$id")({
  head: () => ({ meta: [{ title: "Application — Admin" }] }),
  component: AppDetail,
});

type Full = {
  id: string; application_id: string; created_at: string; payment_status: string; application_status: string;
  user_id: string; experience: string | null; recharge_pin: string | null; cv_url: string | null; passport_url: string | null;
  full_name: string; phone: string; email: string | null; nationality: string | null; gender: string | null; current_location: string | null;
  date_of_birth: string | null; marital_status: string | null; in_saudi_arabia: boolean | null;
  iqama_status: string | null; iqama_profession: string | null; iqama_number: string | null; iqama_expiry: string | null;
  amount_paid: number;
  job: { title: string; location: string | null; application_fee: number | null; company_name: string; company: { name: string; logo_url: string | null } | null } | null;
};

type UserDoc = { id: string; kind: string; name: string; url: string; created_at: string };

function AppDetail() {
  const { id } = Route.useParams();
  const [a, setA] = useState<Full | null>(null);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [msg, setMsg] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [popup, setPopup] = useState({ title: "", message: "" });
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    const { data, error } = await supabase.from("applications").select(ADMIN_APPLICATION_DETAIL_SELECT).eq("id", id).maybeSingle();
    if (error) console.error("Failed to load application:", error.message);
    const row = data as unknown as Full | null;
    setA(row);
    if (row?.user_id) {
      const { data: docs } = await supabase.from("user_documents").select("id, kind, name, url, created_at")
        .eq("user_id", row.user_id).order("created_at", { ascending: false });
      setUserDocs((docs ?? []) as UserDoc[]);
    } else {
      setUserDocs([]);
    }
  };
  useEffect(() => { load(); }, [id]);

  const setStatus = async (s: "accepted" | "rejected" | "shortlisted" | "under_review") => {
    if (!a) return;
    const label = s.replace("_", " ");
    if (!window.confirm(`Mark this application as ${label}?`)) return;
    setBusyKey(`app-${s}`);
    const { error } = await supabase.from("applications").update({ application_status: s }).eq("id", a.id);
    if (error) {
      showToast("Failed to update application.", "error");
      setBusyKey(null);
      return;
    }
    await supabase.from("notifications").insert({ user_id: a.user_id, title: `Application ${label}`, message: `Your application for ${a.job?.title ?? ""} is now ${label}.`, type: "application_update" });
    showToast(`Application ${label}.`);
    await load();
    setBusyKey(null);
  };

  const verify = async (ok: boolean) => {
    if (!a) return;
    const action = ok ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return;
    setBusyKey(ok ? "pay-ok" : "pay-no");
    const { error } = await supabase.from("applications").update({ payment_status: ok ? "verified" : "rejected" }).eq("id", a.id);
    if (error) {
      showToast("Failed to update payment.", "error");
      setBusyKey(null);
      return;
    }
    await supabase.from("notifications").insert({ user_id: a.user_id, title: `Payment ${ok ? "Verified" : "Rejected"}`, message: ok ? "STC recharge pin verified." : "STC recharge pin rejected.", type: "application_update" });
    showToast(ok ? "Payment approved." : "Payment rejected.");
    await load();
    setBusyKey(null);
  };

  const sendMessage = async () => {
    if (!a || !msg.trim()) return;
    setSendingMsg(true);
    let attachment_url: string | null = null;
    let attachment_name: string | null = null;
    try {
      if (attachFile) {
        const uploaded = await uploadAdminAttachment(a.user_id, attachFile);
        attachment_url = uploaded.path;
        attachment_name = uploaded.name;
      }
      await supabase.from("messages").insert({
        user_id: a.user_id,
        application_id: a.id,
        title: "Message from Admin",
        message: msg.trim(),
        attachment_url,
        attachment_name,
      });
      await supabase.from("notifications").insert({
        user_id: a.user_id,
        title: "New message",
        message: msg.trim().slice(0, 120),
        type: "system",
        attachment_url,
        attachment_name,
      });
      showToast("Message sent.");
      setMsg("");
      setAttachFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      showToast("Failed to send message.", "error");
    }
    setSendingMsg(false);
  };

  const sendPopup = async () => {
    if (!a || !popup.message.trim()) return;
    await supabase.from("popups").insert({ user_id: a.user_id, title: popup.title || "Notice", message: popup.message.trim() });
    showToast("Popup sent to user.");
    setPopup({ title: "", message: "" });
  };

  if (!a) return <AdminLayout title="Application"><div className="text-sm text-muted-foreground">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title={`Application ${a.application_id}`} subtitle={a.job?.title ?? ""}>
      {toast && <AdminToast text={toast.text} type={toast.type} />}

      <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm text-brand-blue mb-4"><ArrowLeft className="w-4 h-4" /> Back to applications</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Applicant</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Full Name" v={a.full_name} />
              <Info label="WhatsApp" v={a.phone} />
              <Info label="Email" v={a.email} />
              <Info label="Date of Birth" v={a.date_of_birth} />
              <Info label="Gender" v={a.gender} />
              <Info label="Marital Status" v={a.marital_status} />
              <Info label="Nationality" v={a.nationality} />
              <Info label="Location" v={a.current_location} />
              <Info label="In Saudi Arabia" v={a.in_saudi_arabia == null ? null : a.in_saudi_arabia ? "Yes" : "No"} />
              <Info label="Experience" v={a.experience ?? "—"} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Iqama Details</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Iqama Status" v={a.iqama_status} />
              <Info label="Iqama Profession" v={a.iqama_profession} />
              <Info label="Iqama Number" v={a.iqama_number} mono />
              <Info label="Iqama Expiry" v={a.iqama_expiry} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Application Documents</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <DocLink label="CV / Resume" bucket="cv" path={a.cv_url} />
              <DocLink label="Additional Documents" bucket="passport" path={a.passport_url} />
            </div>
            {userDocs.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold text-muted-foreground mb-2">From My Documents page</div>
                <div className="space-y-2">
                  {userDocs.map((d) => (
                    <UserDocLink key={d.id} doc={d} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Payment</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Application Fee" v={a.job?.application_fee ? `${a.job.application_fee} SAR` : "Free"} />
              <Info label="Status" v={a.payment_status} />
              <Info label="STC Recharge PIN" v={a.recharge_pin ?? "—"} mono />
            </div>
            {a.payment_status === "pending" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={!!busyKey}
                  onClick={() => verify(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-60 active:scale-95 transition"
                >
                  {busyKey === "pay-ok" ? <AdminSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  Approve PIN
                </button>
                <button
                  disabled={!!busyKey}
                  onClick={() => verify(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 active:scale-95 transition"
                >
                  {busyKey === "pay-no" ? <AdminSpinner className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Reject PIN
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Application Decision</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={!!busyKey} onClick={() => setStatus("accepted")} className="px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-60 active:scale-95 transition">
                {busyKey === "app-accepted" ? "…" : "Accept"}
              </button>
              <button disabled={!!busyKey} onClick={() => setStatus("rejected")} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-60 active:scale-95 transition">
                {busyKey === "app-rejected" ? "…" : "Reject"}
              </button>
              <button disabled={!!busyKey} onClick={() => setStatus("shortlisted")} className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-60 active:scale-95 transition">Shortlist</button>
              <button disabled={!!busyKey} onClick={() => setStatus("under_review")} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-60 active:scale-95 transition">Under Review</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Send Message</div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Custom message…" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary/40 flex items-center justify-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              {attachFile ? attachFile.name : "Attach document or image (optional)"}
            </button>
            <button
              onClick={sendMessage}
              disabled={!msg.trim() || sendingMsg}
              className="mt-2 w-full inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
            >
              {sendingMsg ? <AdminSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {sendingMsg ? "Sending…" : "Send"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="font-bold text-brand-navy">Send Popup</div>
            <input value={popup.title} onChange={(e) => setPopup({ ...popup, title: e.target.value })} placeholder="Title" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <textarea value={popup.message} onChange={(e) => setPopup({ ...popup, message: e.target.value })} rows={3} placeholder="Popup body…" className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <button onClick={sendPopup} className="mt-2 w-full py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold active:scale-95 transition">Show Popup to User</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, v, mono }: { label: string; v: string | null | undefined; mono?: boolean }) {
  return <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className={`text-sm font-semibold text-brand-navy ${mono ? "font-mono" : ""}`}>{v ?? "—"}</div></div>;
}

function DocLink({ label, bucket, path }: { label: string; bucket: "cv" | "passport"; path: string | null }) {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setHref(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getApplicationDocUrl(bucket, path).then((url) => {
      if (!cancelled) {
        setHref(url);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [bucket, path]);

  if (!path) return <div className="border border-border rounded-lg p-3 text-sm text-muted-foreground">{label}: Not uploaded</div>;
  if (loading) return <div className="border border-border rounded-lg p-3 text-sm text-muted-foreground">{label}: Loading…</div>;
  if (!href) return <div className="border border-border rounded-lg p-3 text-sm text-rose-600">{label}: Unable to load file</div>;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="border border-border rounded-lg p-3 text-sm flex items-center justify-between hover:bg-secondary">
      <span className="font-semibold text-brand-navy">{label}</span>
      <Download className="w-4 h-4 text-brand-blue" />
    </a>
  );
}

function UserDocLink({ doc }: { doc: UserDoc }) {
  const open = async () => {
    const url = await getDocumentSignedUrl(doc.url);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <button type="button" onClick={open} className="w-full border border-border rounded-lg p-3 text-sm flex items-center justify-between hover:bg-secondary text-left">
      <span className="font-semibold text-brand-navy capitalize">{doc.kind}: {doc.name}</span>
      <Download className="w-4 h-4 text-brand-blue shrink-0" />
    </button>
  );
}
