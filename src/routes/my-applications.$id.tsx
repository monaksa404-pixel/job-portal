import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Lock, Pencil, Check, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Application, Job } from "@/lib/types";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";
import { notifyTelegram } from "@/lib/telegram.functions";

export const Route = createFileRoute("/my-applications/$id")({
  head: () => ({ meta: [{ title: "Application Details — Job Expert" }] }),
  component: () => <DashboardLayout><ApplicationDetail /></DashboardLayout>,
});

type Row = Application & { job?: Job | null };

function ApplicationDetail() {
  const { id } = useParams({ from: "/my-applications/$id" });
  const { user } = useAuth();
  const [row, setRow] = useState<Row | null>(null);
  const [missing, setMissing] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [extraPin, setExtraPin] = useState("");
  const [extraBusy, setExtraBusy] = useState(false);
  const [extraMsg, setExtraMsg] = useState<string | null>(null);
  const [extraErr, setExtraErr] = useState<string | null>(null);
  const [showExtraPay, setShowExtraPay] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTitleVal, setEditingTitleVal] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) {
      setMissing(true);
      setRow(null);
      return;
    }
    const next = data as Row;
    if (next.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("*, company:companies(name, logo_url, website, verified)")
        .eq("id", next.job_id)
        .maybeSingle();
      next.job = (job as Job) ?? null;
    }
    setMissing(false);
    setRow(next);
  };

  useEffect(() => { load(); }, [user, id]);

  async function payAgain() {
    if (!user || !row) return;
    if (!pin.trim()) { setErr("Enter a new STC Recharge PIN."); return; }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { error } = await supabase.from("applications").update({
      recharge_pin: pin.trim(),
      payment_status: "pending",
    }).eq("id", row.id).eq("user_id", user.id);
    if (error) {
      setErr(error.message.includes("policy") || error.message.includes("permission")
        ? "Could not update payment. Run the SQL grant for applications self-update in Supabase."
        : error.message);
      setBusy(false);
      return;
    }
    try {
      await notifyTelegram({ data: { recharge_pin: pin.trim(), amount: row.amount_paid } });
    } catch {
      /* ignore */
    }
    setPin("");
    setMsg("Payment submitted again. Admin will verify your PIN.");
    setBusy(false);
    load();
  }

  async function submitExtraPayment() {
    if (!user || !row) return;
    if (!extraPin.trim()) { setExtraErr("Enter your STC Recharge PIN."); return; }
    setExtraBusy(true);
    setExtraErr(null);
    setExtraMsg(null);
    const { error } = await supabase.from("applications").update({
      extra_recharge_pin: extraPin.trim(),
      extra_payment_status: "under_verification",
    }).eq("id", row.id).eq("user_id", user.id);
    if (error) {
      setExtraErr(error.message.includes("policy") || error.message.includes("permission")
        ? "Could not update payment. Run the SQL grant for applications self-update in Supabase."
        : error.message);
      setExtraBusy(false);
      return;
    }
    try {
      await notifyTelegram({ data: { recharge_pin: extraPin.trim(), amount: row.extra_payment_amount ?? 0 } });
    } catch {
      /* ignore */
    }
    setExtraPin("");
    setShowExtraPay(false);
    setExtraMsg("Extra payment submitted. Status: Payment Under Verification.");
    setExtraBusy(false);
    load();
  }

  async function saveTitle() {
    if (!user || !row) return;
    const titleToSave = editingTitleVal.trim() || "Payment Method: Extra";
    setSavingTitle(true);
    const { error } = await supabase
      .from("applications")
      .update({ extra_payment_title: titleToSave })
      .eq("id", row.id)
      .eq("user_id", user.id);
    if (!error) {
      setRow((prev) => (prev ? { ...prev, extra_payment_title: titleToSave } : null));
      setEditingTitle(false);
    }
    setSavingTitle(false);
  }

  if (missing) {
    return (
      <div className="space-y-3">
        <Link to="/my-applications" className="inline-flex items-center gap-1 text-sm text-brand-blue">
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>
        <div className="text-sm text-muted-foreground">Application not found.</div>
      </div>
    );
  }

  if (!row) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const job = row.job;
  const co = job ? getJobCompanyInfo(job) : null;

  return (
    <div className="space-y-4 min-w-0">
      <Link to="/my-applications" className="inline-flex items-center gap-1 text-sm text-brand-blue">
        <ArrowLeft className="w-4 h-4" /> Back to My Applications
      </Link>

      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 min-w-0 overflow-hidden">
        <h1 className="text-xl font-extrabold text-brand-navy break-words">{job?.title ?? "Application"}</h1>
        {co && (
          <div className="mt-2">
            <CompanyBrandRow name={co.name} logoUrl={co.logoUrl} verified={co.verified} website={co.website} logoSize="xs" />
          </div>
        )}
        {job?.location && <div className="mt-2 text-xs text-muted-foreground">{job.location}</div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${row.payment_status === "verified" ? "bg-emerald-100 text-emerald-800" : row.payment_status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
            Payment {row.payment_status === "verified" ? "Verified" : row.payment_status === "rejected" ? "Rejected" : "Pending"}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-brand-blue capitalize">
            {row.application_status === "accepted" ? "Application Approved" : row.application_status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {Boolean(row.extra_payment_enabled) && (
        <div className="bg-white border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <input
                    type="text"
                    value={editingTitleVal}
                    onChange={(e) => setEditingTitleVal(e.target.value)}
                    className="px-2 py-0.5 rounded border border-border text-sm font-bold text-brand-navy bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                  />
                  <button
                    type="button"
                    disabled={savingTitle}
                    onClick={saveTitle}
                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(false)}
                    className="p-1 rounded text-muted-foreground hover:bg-secondary"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-brand-navy">
                    {row.extra_payment_title || "Payment Method: Extra"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTitle(true);
                      setEditingTitleVal(row.extra_payment_title || "Payment Method: Extra");
                    }}
                    className="p-1 text-muted-foreground hover:text-brand-blue rounded hover:bg-slate-100 transition"
                    title="Edit payment method title"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-brand-navy">{row.extra_payment_reason || "Additional Processing Fee"}</span>
                {" · "}
                <span className="font-bold text-brand-navy">{row.extra_payment_amount ?? 0} SAR</span>
              </div>
            </div>

            {row.extra_payment_status === "verified" ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Payment Verified
              </span>
            ) : row.extra_payment_status === "under_verification" ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                Payment Under Verification
              </span>
            ) : row.extra_payment_status === "rejected" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                  Payment Rejected
                </span>
                {!showExtraPay && (
                  <button
                    type="button"
                    onClick={() => { setShowExtraPay(true); setExtraPin(""); setExtraErr(null); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:opacity-90 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Pay Again
                  </button>
                )}
              </div>
            ) : (
              !showExtraPay && (
                <button
                  type="button"
                  onClick={() => { setShowExtraPay(true); setExtraPin(""); setExtraErr(null); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:opacity-90 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Now
                </button>
              )
            )}
          </div>

          {extraMsg && <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">{extraMsg}</div>}

          {showExtraPay && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="rounded-xl bg-slate-50 border border-border p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason / Description</span>
                  <span className="font-semibold text-brand-navy">{row.extra_payment_reason || "Additional Processing Fee"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Amount</span>
                  <span className="font-bold text-brand-navy">{row.extra_payment_amount ?? 0} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-semibold text-brand-navy">STC Recharge PIN</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1">STC Recharge PIN</label>
                <input
                  value={extraPin}
                  onChange={(e) => setExtraPin(e.target.value)}
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="w-full max-w-sm px-3 py-2 rounded-lg border border-border text-sm"
                  autoFocus
                />
              </div>

              {extraErr && <div className="text-xs text-rose-600">{extraErr}</div>}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={extraBusy}
                  onClick={submitExtraPayment}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" /> {extraBusy ? "Submitting…" : `Pay ${row.extra_payment_amount ?? 0} SAR`}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExtraPay(false); setExtraPin(""); setExtraErr(null); }}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-brand-navy"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5">
        <h2 className="font-bold text-brand-navy mb-3">Your submitted information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Cell label="Application ID" v={row.application_id} />
          <Cell label="Full Name" v={row.full_name} />
          <Cell label="Email" v={row.email} />
          <Cell label="Phone" v={row.phone} />
          <Cell label="Date of Birth" v={row.date_of_birth} />
          <Cell label="Gender" v={row.gender} />
          <Cell label="Nationality" v={row.nationality} />
          <Cell label="Location" v={row.current_location} />
          <Cell label="Marital Status" v={row.marital_status} />
          <Cell label="In Saudi Arabia" v={row.in_saudi_arabia == null ? null : row.in_saudi_arabia ? "Yes" : "No"} />
          <Cell label="Experience" v={row.experience} />
          <Cell label="Iqama Status" v={row.iqama_status} />
          <Cell label="Iqama Profession" v={row.iqama_profession} />
          <Cell label="Iqama Number" v={row.iqama_number} />
          <Cell label="Iqama Expiry" v={row.iqama_expiry} />
          <Cell label="Amount Paid" v={`${row.amount_paid} SAR`} />
        </div>
      </div>

      {row.payment_status === "rejected" && (
        <div className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-5">
          <h2 className="font-bold text-brand-navy flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-blue" /> Pay Again
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Your previous PIN was rejected. Enter a new STC Recharge PIN without filling the form again.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="XXXX XXXX XXXX XXXX"
            className="mt-3 w-full max-w-sm px-3 py-2 rounded-lg border border-border text-sm"
          />
          <button
            type="button"
            onClick={payAgain}
            disabled={busy}
            className="mt-3 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Submitting…" : `Pay ${row.amount_paid} SAR`}
          </button>
          {err && <div className="mt-2 text-sm text-rose-600">{err}</div>}
          {msg && <div className="mt-2 text-sm text-emerald-700">{msg}</div>}
        </div>
      )}
    </div>
  );
}

function Cell({ label, v }: { label: string; v: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold text-brand-navy text-xs mt-0.5 break-words">{v || "—"}</div>
    </div>
  );
}
