import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, CreditCard } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Application, Job } from "@/lib/types";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";
import { formatDateTime } from "@/lib/queries";
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
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    const row = (data as Row) ?? null;
    if (row?.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("*, company:companies(name, logo_url, website, verified)")
        .eq("id", row.job_id)
        .maybeSingle();
      row.job = (job as Job) ?? null;
    }
    setRow(row);
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
      setErr(error.message);
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

  if (!row) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const job = row.job;
  const co = job ? getJobCompanyInfo(job) : null;
  const submitted = formatDateTime(row.created_at);

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
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <Clock className="w-3 h-3 shrink-0" /> Applied {submitted.date} · {submitted.time}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${row.payment_status === "verified" ? "bg-emerald-100 text-emerald-800" : row.payment_status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
            Payment {row.payment_status}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-brand-blue capitalize">
            {row.application_status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

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
