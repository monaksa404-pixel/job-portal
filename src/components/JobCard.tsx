import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-navy leading-snug text-base">{job.title}</h3>
          <div className="mt-2">
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
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
              {job.job_type}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
              {job.experience_required}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatRelative(job.created_at)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-brand-blue font-bold text-sm whitespace-nowrap">
            {job.salary.toLocaleString()} {job.salary_currency}
          </div>
          <div className="text-[10px] text-muted-foreground">{job.salary_period}</div>
          <button onClick={onToggle} aria-label="Save job" className="mt-1 inline-flex">
            <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
    </Link>
  );
}
