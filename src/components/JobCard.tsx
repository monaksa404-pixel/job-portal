import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { JobInfoGrid } from "@/components/JobInfoGrid";
import { JobSalaryDisplay } from "@/components/JobSalaryDisplay";
import { formatRelative } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { isJobSaved, toggleSaveJob } from "@/lib/saved";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";

export function JobCard({ job }: { job: Job }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const co = getJobCompanyInfo(job);

  useEffect(() => {
    if (!user) return;
    isJobSaved(user.id, job.id).then(setSaved);
  }, [user, job.id]);

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth", search: { next: `/jobs/${job.id}` } });
      return;
    }
    try {
      setSaved(await toggleSaveJob(user.id, job.id));
    } catch {
      /* ignore */
    }
  }

  return (
    <Link
      to="/jobs/$id"
      params={{ id: job.id }}
      className="block bg-white border border-border rounded-2xl p-4 hover:border-brand-blue/40 hover:shadow-md transition"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-navy leading-snug text-base break-words">{job.title}</h3>
          <div className="mt-2 overflow-visible">
            <CompanyBrandRow
              name={co.name}
              logoUrl={co.logoUrl}
              verified={co.verified}
              website={co.website}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <MapPin className="w-3 h-3 shrink-0" /> {job.location}
          </p>
        </div>
        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
          <JobSalaryDisplay job={job} size="sm" />
          <button onClick={onToggle} aria-label="Save job" className="sm:mt-1 inline-flex shrink-0">
            <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <JobInfoGrid job={job} compact />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{formatRelative(job.created_at)}</div>
    </Link>
  );
}
