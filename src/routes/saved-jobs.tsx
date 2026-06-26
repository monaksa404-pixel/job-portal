import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/saved-jobs")({
  head: () => ({ meta: [{ title: "Saved Jobs — Job Expert" }] }),
  component: () => <DashboardLayout><SavedJobsPage /></DashboardLayout>,
});

type Row = { id: string; job_id: string; job: Job };

function SavedJobsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_jobs")
      .select("id, job_id, job:jobs(*)").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function remove(id: string) {
    await supabase.from("saved_jobs").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Saved Jobs</h1>
      <p className="text-sm text-muted-foreground">Jobs you've bookmarked for later.</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center">
            <div className="text-sm text-muted-foreground">No saved jobs yet.</div>
            <Link to="/jobs" className="mt-3 inline-block px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">Browse Jobs</Link>
          </div>
        ) : rows.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold">
              {r.job.company_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <Link to="/jobs/$id" params={{ id: r.job.id }} className="flex-1 min-w-0">
              <div className="font-bold text-brand-navy truncate">{r.job.title}</div>
              <div className="text-xs text-muted-foreground truncate">{r.job.company_name} · {r.job.location}</div>
              <div className="text-xs font-semibold text-brand-blue mt-1">{r.job.salary.toLocaleString()} {r.job.salary_currency}</div>
            </Link>
            <button onClick={() => remove(r.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}