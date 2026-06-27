import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: Reports,
});

function Reports() {
  const [s, setS] = useState({ jobs: 0, apps: 0, accepted: 0, rejected: 0, pending: 0, revenue: 0 });
  useEffect(() => { (async () => {
    const [{ count: j }, { count: a }] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]);
    type AppRow = { application_status: string; payment_status: string; job: { application_fee: number | null } | null };
    const res = await supabase.from("applications").select("application_status, payment_status, job:jobs(application_fee)");
    const app = (res.data ?? []) as unknown as AppRow[];
    const acc = app.filter((x) => x.application_status === "accepted").length;
    const rej = app.filter((x) => x.application_status === "rejected").length;
    const pen = app.filter((x) => x.payment_status === "pending").length;
    const rev = app.filter((x) => x.payment_status === "verified")
      .reduce((sum, x) => sum + (x.job?.application_fee ?? 0), 0);
    setS({ jobs: j ?? 0, apps: a ?? 0, accepted: acc, rejected: rej, pending: pen, revenue: rev });
  })(); }, []);

  return (
    <AdminLayout title="Reports" subtitle="Platform overview">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ["Total Jobs", s.jobs], ["Total Applications", s.apps], ["Accepted", s.accepted],
          ["Rejected", s.rejected], ["Pending Payments", s.pending], ["Verified Revenue (SAR)", s.revenue],
        ].map(([label, v]) => (
          <div key={label as string} className="bg-white rounded-2xl border border-border p-5">
            <div className="text-xs text-muted-foreground">{label as string}</div>
            <div className="text-3xl font-extrabold text-brand-navy mt-1">{(v as number).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
