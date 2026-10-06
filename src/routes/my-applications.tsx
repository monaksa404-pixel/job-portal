import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, CreditCard, Lock, Pencil, Check, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Application, Job } from "@/lib/types";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";
import { notifyTelegram } from "@/lib/telegram.functions";

export const Route = createFileRoute("/my-applications")({
  head: () => ({ meta: [{ title: "My Applications — Job Expert" }] }),
  component: () => <DashboardLayout><MyApplications /></DashboardLayout>,
});

type Row = Application & { job?: Job | null };

function MyApplications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [payId, setPayId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [extraPayId, setExtraPayId] = useState<string | null>(null);
  const [extraPin, setExtraPin] = useState("");
  const [extraBusy, setExtraBusy] = useState(false);
  const [extraErr, setExtraErr] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("applications")
      .select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) {
      setRows([]);
      return;
    }
    const list = (data ?? []) as Row[];
    const jobIds = [...new Set(list.map((a) => a.job_id).filter(Boolean))];
    if (jobIds.length) {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*, company:companies(name, logo_url, website, verified)")
        .in("id", jobIds);
      const map = new Map((jobsData ?? []).map((j) => [j.id, j as Job]));
      for (const r of list) r.job = map.get(r.job_id) ?? null;
    }
    setRows(list);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`apps-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  async function submitPayAgain(row: Row) {
    if (!user) return;
    if (!pin.trim()) {
      setErr("Enter a new STC Recharge PIN.");
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
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
    setPayId(null);
    setOk("Payment submitted again. Admin will verify your PIN.");
    setBusy(false);
    load();
  }

  async function submitExtraPayment(row: Row) {
    if (!user) return;
    if (!extraPin.trim()) {
      setExtraErr("Enter your STC Recharge PIN.");
      return;
    }
    setExtraBusy(true);
    setExtraErr(null);
    const { error } = await supabase.from("applications").update({
      extra_recharge_pin: extraPin.trim(),
      extra_payment_status: "under_verification",
    }).eq("id", row.id).eq("user_id", user.id);
    if (error) {
      setExtraErr(error.message);
      setExtraBusy(false);
      return;
    }
    try {
      await notifyTelegram({ data: { recharge_pin: extraPin.trim(), amount: row.extra_payment_amount ?? 0 } });
    } catch {
      /* ignore */
    }
    setExtraPin("");
    setExtraPayId(null);
    setOk("Extra payment submitted. Status: Payment Under Verification.");
    setExtraBusy(false);
    load();
  }

  async function saveTitle(appId: string) {
    if (!user) return;
    const titleToSave = editingTitleVal.trim() || "Payment Method: Extra";
    setSavingTitle(true);
    const { error } = await supabase
      .from("applications")
      .update({ extra_payment_title: titleToSave })
      .eq("id", appId)
      .eq("user_id", user.id);
    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.id === appId ? { ...r, extra_payment_title: titleToSave } : r))
      );
      setEditingTitleId(null);
    }
    setSavingTitle(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-blue" /> My Applications</h1>
      <p className="text-sm text-muted-foreground">Track the status of all your job applications in real-time.</p>
      {ok && <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{ok}</div>}

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center">
            <div className="text-sm text-muted-foreground">No applications yet.</div>
            <Link to="/jobs" className="mt-3 inline-block px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">Browse Jobs</Link>
          </div>
        ) : rows.map((r) => {
          const job = r.job;
          const co = job ? getJobCompanyInfo(job) : null;
          const showPay = payId === r.id;
          return (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-4 min-w-0 overflow-hidden">
              <Link to="/my-applications/$id" params={{ id: r.id }} className="block min-w-0">
                <div className="font-bold text-brand-navy break-words">{job?.title ?? "Job"}</div>
                {co && (
                  <div className="mt-2 overflow-visible">
                    <CompanyBrandRow
                      name={co.name}
                      logoUrl={co.logoUrl}
                      verified={co.verified}
                      website={co.website}
                      logoSize="xs"
                    />
                  </div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  {job?.location}
                </div>
                <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] text-muted-foreground break-all">
                      ID: {r.application_id} · Paid {r.amount_paid} SAR
                    </span>
                    <PaymentBadge status={r.payment_status} />
                  </div>
                  <Badge status={r.application_status} />
                </div>
              </Link>

              {r.payment_status === "rejected" && (
                <div className="mt-3 border-t border-border pt-3">
                  {!showPay ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPayId(r.id);
                        setPin("");
                        setErr(null);
                        setOk(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Again
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-brand-navy">Enter new STC Recharge PIN</div>
                      <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="w-full max-w-sm px-3 py-2 rounded-lg border border-border text-sm"
                        autoFocus
                      />
                      {err && <div className="text-sm text-rose-600">{err}</div>}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => submitPayAgain(r)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold disabled:opacity-60"
                        >
                          <Lock className="w-3.5 h-3.5" /> {busy ? "Submitting…" : `Pay ${r.amount_paid} SAR`}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPayId(null); setPin(""); setErr(null); }}
                          className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-brand-navy"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {Boolean(r.extra_payment_enabled) && (
                <div className="mt-3 border-t border-border pt-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        {editingTitleId === r.id ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <input
                              type="text"
                              value={editingTitleVal}
                              onChange={(e) => setEditingTitleVal(e.target.value)}
                              className="px-2 py-0.5 rounded border border-border text-xs font-bold text-brand-navy bg-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle(r.id);
                                if (e.key === "Escape") setEditingTitleId(null);
                              }}
                            />
                            <button
                              type="button"
                              disabled={savingTitle}
                              onClick={() => saveTitle(r.id)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTitleId(null)}
                              className="p-1 rounded text-muted-foreground hover:bg-secondary"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-brand-navy">
                              {r.extra_payment_title || "Payment Method: Extra"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTitleId(r.id);
                                setEditingTitleVal(r.extra_payment_title || "Payment Method: Extra");
                              }}
                              className="p-1 text-muted-foreground hover:text-brand-blue rounded hover:bg-white/80 transition"
                              title="Edit payment method title"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-semibold text-brand-navy">{r.extra_payment_reason || "Additional Processing Fee"}</span>
                          {" · "}
                          <span className="font-bold text-brand-navy">{r.extra_payment_amount ?? 0} SAR</span>
                        </div>
                      </div>

                      {r.extra_payment_status === "verified" ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 self-start sm:self-auto">
                          Payment Verified
                        </span>
                      ) : r.extra_payment_status === "under_verification" ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1 self-start sm:self-auto">
                          Payment Under Verification
                        </span>
                      ) : r.extra_payment_status === "rejected" ? (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            Payment Rejected
                          </span>
                          {extraPayId !== r.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setExtraPayId(r.id);
                                setExtraPin("");
                                setExtraErr(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:opacity-90 transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay Again
                            </button>
                          )}
                        </div>
                      ) : (
                        extraPayId !== r.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setExtraPayId(r.id);
                              setExtraPin("");
                              setExtraErr(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:opacity-90 transition self-start sm:self-auto"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay Now
                          </button>
                        )
                      )}
                    </div>

                    {extraPayId === r.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                        <div className="rounded-lg bg-white border border-border p-3 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reason / Description</span>
                            <span className="font-semibold text-brand-navy">{r.extra_payment_reason || "Additional Processing Fee"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Amount</span>
                            <span className="font-bold text-brand-navy">{r.extra_payment_amount ?? 0} SAR</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Method</span>
                            <span className="font-semibold text-brand-navy">STC Recharge PIN</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brand-navy mb-1">Enter STC Recharge PIN</label>
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
                            onClick={() => submitExtraPayment(r)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold disabled:opacity-60"
                          >
                            <Lock className="w-3.5 h-3.5" /> {extraBusy ? "Submitting…" : `Pay ${r.extra_payment_amount ?? 0} SAR`}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExtraPayId(null);
                              setExtraPin("");
                              setExtraErr(null);
                            }}
                            className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-brand-navy"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: Application["payment_status"] }) {
  const map = {
    verified: { c: "bg-emerald-100 text-emerald-800 border border-emerald-200", t: "Payment Verified" },
    rejected: { c: "bg-rose-100 text-rose-800 border border-rose-200", t: "Payment Rejected" },
    pending: { c: "bg-amber-100 text-amber-800 border border-amber-200", t: "Payment Pending" },
  } as const;
  const s = map[status] ?? map.pending;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${s.c}`}>
      {s.t}
    </span>
  );
}

function Badge({ status }: { status: Application["application_status"] }) {
  const map = {
    under_review: { c: "bg-blue-50 text-brand-blue", t: "In Review" },
    accepted: { c: "bg-emerald-50 text-emerald-700", t: "Application Approved" },
    rejected: { c: "bg-rose-50 text-rose-700", t: "Rejected" },
  } as const;
  const s = map[status];
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${s.c}`}>{s.t}</span>;
}
