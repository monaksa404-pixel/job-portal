import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/saved-jobs")({
  head: () => ({ meta: [{ title: "Saved Jobs — Job Expert" }] }),
  component: () => <DashboardLayout><SavedJobsPage /></DashboardLayout>,
});

type Row = { id: string; job_id: string; job: Job | null };

function SavedJobsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: saved, error } = await supabase
      .from("saved_jobs")
      .select("id, job_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error || !saved?.length) {
      setRows([]);
      return;
    }
    const jobIds = saved.map((s) => s.job_id);
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*, company:companies(name, logo_url, website, verified)")
      .in("id", jobIds);
    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j as Job]));
    setRows(
      saved.map((s) => ({
        id: s.id,
        job_id: s.job_id,
        job: jobMap.get(s.job_id) ?? null,
      })),
    );
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function remove(id: string) {
    await supabase.from("saved_jobs").delete().eq("id", id);
    load();
  }

  const visible = rows.filter((r) => r.job);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Saved Jobs</h1>
      <p className="text-sm text-muted-foreground">Jobs you've bookmarked for later.</p>
      <div className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center">
            <div className="text-sm text-muted-foreground">No saved jobs yet.</div>
            <Link to="/jobs" className="mt-3 inline-block px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">Browse Jobs</Link>
          </div>
        ) : visible.map((r) => {
          const job = r.job!;
          const co = getJobCompanyInfo(job);
          return (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-4 flex items-start gap-3">
              <Link to="/jobs/$id" params={{ id: job.id }} className="flex-1 min-w-0">
                <div className="font-bold text-brand-navy leading-snug">{job.title}</div>
                <div className="mt-2 overflow-visible">
                  <CompanyBrandRow
                    name={co.name}
                    logoUrl={co.logoUrl}
                    verified={co.verified}
                    website={co.website}
                    logoSize="sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="w-3 h-3 shrink-0" /> {job.location}
                </p>
                <div className="text-sm font-bold text-brand-blue mt-2">
                  {job.salary.toLocaleString()} {job.salary_currency}
                </div>
              </Link>
              <button onClick={() => remove(r.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 shrink-0" aria-label="Remove saved job">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
