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
      className="block w-full min-w-0 overflow-hidden bg-white border border-border rounded-2xl p-4 hover:border-brand-blue/40 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <h3 className="flex-1 min-w-0 font-bold text-brand-navy leading-snug text-base break-words">{job.title}</h3>
        <button onClick={onToggle} aria-label="Save job" className="shrink-0 p-0.5 -mr-0.5 -mt-0.5">
          <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="mt-2 min-w-0 w-full">
        <CompanyBrandRow
          name={co.name}
          logoUrl={co.logoUrl}
          verified={co.verified}
          website={co.website}
        />
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1 mt-2 min-w-0">
        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
        <span className="break-words min-w-0">{job.location}</span>
      </p>

      <div className="mt-2 min-w-0">
        <JobSalaryDisplay job={job} size="sm" align="left" />
      </div>

      <div className="mt-3 min-w-0">
        <JobInfoGrid job={job} compact />
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground break-words">{formatRelative(job.created_at)}</div>
    </Link>
  );
}
