import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Application, Job } from "@/lib/types";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";

export const Route = createFileRoute("/my-applications")({
  head: () => ({ meta: [{ title: "My Applications — Job Expert" }] }),
  component: () => <DashboardLayout><MyApplications /></DashboardLayout>,
});

type Row = Application & { job?: Job | null };

function MyApplications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("applications")
        .select("*, job:jobs(*, company:companies(name, logo_url, website, verified))")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setRows((data ?? []) as Row[]);
    };
    load();
    const ch = supabase.channel(`apps-${user!.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-blue" /> My Applications</h1>
      <p className="text-sm text-muted-foreground">Track the status of all your job applications in real-time.</p>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center">
            <div className="text-sm text-muted-foreground">No applications yet.</div>
            <Link to="/jobs" className="mt-3 inline-block px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">Browse Jobs</Link>
          </div>
        ) : rows.map((r) => {
          const job = r.job;
          const co = job ? getJobCompanyInfo(job) : null;
          return (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-4">
              <div className="font-bold text-brand-navy truncate">{job?.title ?? "Job"}</div>
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 shrink-0" />
                    ID: {r.application_id} · Paid {r.amount_paid} SAR
                  </span>
                  <PaymentBadge status={r.payment_status} />
                </div>
                <Badge status={r.application_status} />
              </div>
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
    accepted: { c: "bg-emerald-50 text-emerald-700", t: "Shortlisted" },
    rejected: { c: "bg-rose-50 text-rose-700", t: "Rejected" },
  } as const;
  const s = map[status];
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${s.c}`}>{s.t}</span>;
}
