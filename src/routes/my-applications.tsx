import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, BadgeCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "./index";

type Row = {
  id: string;
  application_id: string;
  status: "pending" | "approved" | "rejected" | "verified";
  amount_paid: number;
  created_at: string;
  job: { title: string; company_name: string; location: string } | null;
};

export const Route = createFileRoute("/my-applications")({
  head: () => ({ meta: [{ title: "My Applications — Job Expert" }] }),
  component: MyApplications,
});

function MyApplications() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!u.user) { setLoggedIn(false); return; }
      setLoggedIn(true);
      const uid = u.user.id;

      const load = async () => {
        const { data } = await supabase
          .from("applications")
          .select("id, application_id, status, amount_paid, created_at, job:jobs(title, company_name, location)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });
        if (mounted) setRows((data ?? []) as unknown as Row[]);
      };
      await load();

      channel = supabase
        .channel("user-applications")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${uid}` },
          load)
        .subscribe();
    })();

    return () => { mounted = false; if (channel) supabase.removeChannel(channel); };
  }, []);

  if (loggedIn === false) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-xl font-bold text-brand-navy">Sign in required</h1>
        <p className="text-sm text-muted-foreground mt-1">Please sign in to view your applications.</p>
        <Link to="/auth" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-brand-blue" /> My Applications
      </h1>
      <p className="text-sm text-muted-foreground">Track the status of all your job applications in real-time.</p>

      <div className="mt-6 space-y-3">
        {rows === null ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No applications yet" note="Apply to jobs and they'll appear here." />
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
                <Clock className="w-3 h-3" /> ID: {r.application_id} · Paid {r.amount_paid} SAR
              </div>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const map: Record<Row["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    verified: "bg-blue-50 text-brand-blue",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status]}`}>{status}</span>;
}