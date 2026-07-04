import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_APPLICATION_LIST_SELECT } from "@/lib/admin-applications";
import { uploadAdminAttachment } from "@/lib/storage-url";
import { AdminToast, AdminSpinner } from "@/components/admin/AdminToast";
import { Eye, Check, X, MessageSquare, MoreHorizontal, Search, FileText, Filter, Send, Paperclip, Bold, Italic, Underline } from "lucide-react";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Applications — Admin" }] }),
  component: AdminApplications,
});

type App = {
  id: string; application_id: string; created_at: string; payment_status: string; application_status: string;
  user_id: string; recharge_pin: string | null; full_name: string; email: string | null; phone: string;
  job: { title: string; location: string | null; company_name: string; company: { name: string; logo_url: string | null } | null } | null;
};
type Job = { id: string; title: string };
type Co = { id: string; name: string };

function AdminApplications() {
  const [rows, setRows] = useState<App[]>([]);
  const [stat, setStat] = useState({ total: 0, review: 0, shortlist: 0, rejected: 0, accepted: 0 });
  const [q, setQ] = useState("");
  const [jobId, setJobId] = useState("");
  const [coId, setCoId] = useState("");
  const [status, setStatus] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cos, setCos] = useState<Co[]>([]);

  const [selUser, setSelUser] = useState<{ id: string; name: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(ADMIN_APPLICATION_LIST_SELECT)
      .order("created_at", { ascending: false }).limit(200);
    if (error) {
      console.error("Failed to load applications:", error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as unknown as App[]);
    const all = (data ?? []) as unknown as App[];
    setStat({
      total: all.length,
      review: all.filter((a) => a.application_status === "under_review").length,
      shortlist: all.filter((a) => a.application_status === "shortlisted").length,
      rejected: all.filter((a) => a.application_status === "rejected").length,
      accepted: all.filter((a) => a.application_status === "accepted").length,
    });
  };

  useEffect(() => {
    load();
    supabase.from("jobs").select("id, title").order("created_at", { ascending: false }).then(({ data }) => setJobs((data ?? []) as Job[]));
    supabase.from("companies").select("id, name").order("sort_order").then(({ data }) => setCos((data ?? []) as Co[]));
    const ch = supabase.channel("admin-apps").on("postgres_changes", { event: "*", schema: "public", table: "applications" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => rows.filter((a) =>
    (!q || a.full_name.toLowerCase().includes(q.toLowerCase()) || (a.email ?? "").toLowerCase().includes(q.toLowerCase()) || (a.job?.title ?? "").toLowerCase().includes(q.toLowerCase()))
    && (!jobId || a.job?.title === jobs.find((j) => j.id === jobId)?.title)
    && (!status || a.application_status === status)
  ), [rows, q, jobId, status, jobs]);

  const setStatusFor = async (id: string, s: "accepted" | "rejected" | "shortlisted" | "under_review", userId: string, jobTitle?: string) => {
    const label = s.replace("_", " ");
    if (!window.confirm(`Mark this application as ${label}?`)) return;
    const key = `${id}-app-${s}`;
    setBusyKey(key);
    const { error } = await supabase.from("applications").update({ application_status: s }).eq("id", id);
    if (error) {
      showToast("Failed to update application status.", "error");
      setBusyKey(null);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: userId, title: `Application ${label}`,
      message: `Your application for ${jobTitle ?? "the job"} is now ${label}.`, type: "application_update",
    });
    showToast(`Application ${label}.`);
    await load();
    setBusyKey(null);
  };

  const verifyPayment = async (id: string, ok: boolean, userId: string) => {
    const action = ok ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this STC recharge PIN payment?`)) return;
    const key = `${id}-pay-${ok ? "ok" : "no"}`;
    setBusyKey(key);
    const { error } = await supabase.from("applications").update({ payment_status: ok ? "verified" : "rejected" }).eq("id", id);
    if (error) {
      showToast("Failed to update payment status.", "error");
      setBusyKey(null);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: userId, title: `Payment ${ok ? "Verified" : "Rejected"}`,
      message: ok ? "Your STC recharge pin has been verified." : "Your STC recharge pin could not be verified.",
      type: "application_update",
    });
    showToast(ok ? "Payment approved." : "Payment rejected.");
    await load();
    setBusyKey(null);
  };

  const sendNotif = async () => {
    if (!selUser || !msg.trim()) return;
    setSending(true);
    let attachment_url: string | null = null;
    let attachment_name: string | null = null;
    try {
      if (attachFile) {
        const uploaded = await uploadAdminAttachment(selUser.id, attachFile);
        attachment_url = uploaded.path;
        attachment_name = uploaded.name;
      }
      const payload = {
        user_id: selUser.id,
        title: "Message from Admin",
        message: msg.trim(),
        type: "info" as const,
        attachment_url,
        attachment_name,
      };
      const { error } = await supabase.from("notifications").insert(payload);
      if (error) throw error;
      await supabase.from("messages").insert({
        user_id: selUser.id,
        title: "Message from Admin",
        message: msg.trim(),
        attachment_url,
        attachment_name,
      });
      showToast("Notification sent.");
      setMsg("");
      setAttachFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      showToast("Failed to send notification.", "error");
    }
    setSending(false);
  };

  return (
    <AdminLayout title="Application Management" subtitle="Dashboard / Applications / All Applications" actions={
      <div className="hidden md:flex items-center gap-2 relative w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, job title…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
      </div>
    }>
      {toast && <AdminToast text={toast.text} type={toast.type} />}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox icon={FileText} tint="bg-brand-blue/10 text-brand-blue" label="Total Applications" v={stat.total} />
        <StatBox icon={FileText} tint="bg-amber-100 text-amber-600" label="Under Review" v={stat.review} />
        <StatBox icon={FileText} tint="bg-violet-100 text-violet-600" label="Shortlisted" v={stat.shortlist} />
        <StatBox icon={FileText} tint="bg-rose-100 text-rose-600" label="Rejected" v={stat.rejected} />
        <StatBox icon={FileText} tint="bg-emerald-100 text-emerald-600" label="Accepted" v={stat.accepted} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 mt-4">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative md:hidden flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm"><option value="">All Jobs</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
            <select value={coId} onChange={(e) => setCoId(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm"><option value="">All Companies</option>{cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm">
              <option value="">All Status</option>
              <option value="under_review">Under Review</option><option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option><option value="rejected">Rejected</option>
            </select>
            <button className="px-3 py-2 rounded-lg border border-border text-sm inline-flex items-center gap-1 text-muted-foreground"><Filter className="w-4 h-4" /></button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-secondary/60 text-xs text-muted-foreground">
                <tr><th className="text-left px-5 py-3 font-medium">Applicant</th><th className="text-left px-3 py-3 font-medium">Job Title</th><th className="text-left px-3 py-3 font-medium">Company</th><th className="text-left px-3 py-3 font-medium">Payment</th><th className="text-left px-3 py-3 font-medium">Status</th><th className="text-left px-3 py-3 font-medium">Applied On</th><th className="text-left px-3 py-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No applications</td></tr>}
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold flex items-center justify-center">{a.full_name.slice(0, 1).toUpperCase()}</div>
                        <div>
                          <div className="font-semibold text-brand-navy">{a.full_name}</div>
                          <div className="text-xs text-muted-foreground">{a.email ?? a.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-brand-navy">{a.job?.title ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.job?.location ?? ""}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {a.job?.company?.logo_url && <img src={a.job.company.logo_url} alt="" className="w-5 h-5 rounded" />}
                        {a.job?.company?.name ?? a.job?.company_name ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <PayBadge s={a.payment_status} />
                      {a.recharge_pin && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{a.recharge_pin}</div>}
                    </td>
                    <td className="px-3 py-3"><StatusBadge s={a.application_status} /></td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
                      <div>{new Date(a.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px]">{new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link to="/admin/applications/$id" params={{ id: a.id }} className="p-1.5 rounded hover:bg-secondary" title="View"><Eye className="w-4 h-4 text-muted-foreground" /></Link>
                        {a.payment_status === "pending" && (
                          <>
                            <ActionBtn
                              busy={busyKey === `${a.id}-pay-ok`}
                              onClick={() => verifyPayment(a.id, true, a.user_id)}
                              className="bg-violet-600 text-white hover:bg-violet-700"
                              title="Approve PIN"
                            >
                              {busyKey === `${a.id}-pay-ok` ? <AdminSpinner className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </ActionBtn>
                            <ActionBtn
                              busy={busyKey === `${a.id}-pay-no`}
                              onClick={() => verifyPayment(a.id, false, a.user_id)}
                              className="bg-orange-600 text-white hover:bg-orange-700"
                              title="Reject PIN"
                            >
                              {busyKey === `${a.id}-pay-no` ? <AdminSpinner className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </ActionBtn>
                          </>
                        )}
                        <ActionBtn
                          busy={busyKey === `${a.id}-app-accepted`}
                          onClick={() => setStatusFor(a.id, "accepted", a.user_id, a.job?.title)}
                          className="bg-brand-blue text-white hover:opacity-90"
                          title="Accept Application"
                        >
                          {busyKey === `${a.id}-app-accepted` ? <AdminSpinner className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </ActionBtn>
                        <ActionBtn
                          busy={busyKey === `${a.id}-app-rejected`}
                          onClick={() => setStatusFor(a.id, "rejected", a.user_id, a.job?.title)}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                          title="Reject Application"
                        >
                          {busyKey === `${a.id}-app-rejected` ? <AdminSpinner className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </ActionBtn>
                        <button onClick={() => setSelUser({ id: a.user_id, name: a.full_name })} className="p-1.5 rounded hover:bg-secondary" title="Send Notification"><MessageSquare className="w-4 h-4 text-brand-blue" /></button>
                        <button className="p-1.5 rounded hover:bg-secondary"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 h-fit xl:sticky xl:top-20">
          <div className="font-bold text-brand-navy">Send Notifications</div>
          <div className="text-xs text-muted-foreground">Send custom notifications with optional files.</div>

          <label className="text-xs font-bold mt-4 block">Select User *</label>
          <div className="mt-1 px-3 py-2 rounded-lg border border-border text-sm flex items-center justify-between">
            <span className="text-muted-foreground truncate">{selUser?.name ?? "Pick a row → click message"}</span>
            {selUser && <button onClick={() => setSelUser(null)} className="text-xs text-rose-600">Clear</button>}
          </div>

          <label className="text-xs font-bold mt-3 block">Message *</label>
          <div className="mt-1 border border-border rounded-lg">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border text-muted-foreground">
              <Bold className="w-3.5 h-3.5" /><Italic className="w-3.5 h-3.5" /><Underline className="w-3.5 h-3.5" />
            </div>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Type your message…" className="w-full px-3 py-2 text-sm bg-transparent outline-none" />
          </div>

          <label className="text-xs font-bold mt-3 block">Attach Files <span className="text-muted-foreground font-normal">(Optional)</span></label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 w-full border-2 border-dashed border-border rounded-xl py-6 text-center text-xs text-muted-foreground hover:bg-secondary/40 transition"
          >
            <Paperclip className="w-5 h-5 mx-auto" />
            <div className="mt-1 font-semibold text-brand-navy">
              {attachFile ? attachFile.name : "Click to upload or drag and drop"}
            </div>
            <div>PDF, DOC, DOCX, PNG, JPG (Max 10MB)</div>
          </button>

          <button
            onClick={sendNotif}
            disabled={!selUser || !msg.trim() || sending}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition"
          >
            {sending ? <AdminSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send Notification"}
          </button>
          <div className="mt-3 bg-secondary/60 rounded-lg px-3 py-2 text-xs text-muted-foreground">ⓘ The user will receive this message as a notification.</div>
        </div>
      </div>
    </AdminLayout>
  );
}

function ActionBtn({ children, onClick, className, title, busy }: { children: React.ReactNode; onClick: () => void; className: string; title: string; busy?: boolean }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded inline-flex items-center justify-center active:scale-95 transition disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function StatBox({ icon: Icon, tint, label, v }: { icon: typeof FileText; tint: string; label: string; v: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}><Icon className="w-5 h-5" /></div>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-extrabold text-brand-navy leading-none mt-1">{v.toLocaleString()}</div></div>
    </div>
  );
}
function PayBadge({ s }: { s: string }) {
  const m: Record<string, string> = { pending: "bg-amber-100 text-amber-700", verified: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700" };
  return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${m[s] ?? "bg-secondary"}`}>{s.replace(/^./, (c) => c.toUpperCase())}</span>;
}
function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = { under_review: "bg-amber-100 text-amber-700", accepted: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700", shortlisted: "bg-violet-100 text-violet-700" };
  return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${m[s] ?? "bg-secondary"}`}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}
