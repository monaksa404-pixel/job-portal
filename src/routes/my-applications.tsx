import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, BadgeCheck, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Application } from "@/lib/types";

export const Route = createFileRoute("/my-applications")({
  head: () => ({ meta: [{ title: "My Applications — Job Expert" }] }),
  component: () => <DashboardLayout><MyApplications /></DashboardLayout>,
});

type Row = Application & { job?: { title: string; company_name: string; location: string } };

function MyApplications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("applications")
        .select("*, job:jobs(title, company_name, location)")
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
        ) : rows.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold">
              {(r.job?.company_name ?? "JE").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-brand-navy truncate">{r.job?.title ?? "Job"}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {r.job?.company_name} <BadgeCheck className="w-3.5 h-3.5 text-brand-blue" />
                <span className="mx-1">·</span> {r.job?.location}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> ID: {r.application_id} · Paid {r.amount_paid} SAR · Payment {r.payment_status}
              </div>
            </div>
            <Badge status={r.application_status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ status }: { status: Application["application_status"] }) {
  const map = {
    under_review: { c: "bg-blue-50 text-brand-blue", t: "In Review" },
    accepted: { c: "bg-emerald-50 text-emerald-700", t: "Shortlisted" },
    rejected: { c: "bg-rose-50 text-rose-700", t: "Rejected" },
  } as const;
  const s = map[status];
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.c}`}>{s.t}</span>;
}