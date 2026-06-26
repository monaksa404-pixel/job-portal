import { Link } from "@tanstack/react-router";
import { MapPin, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { formatRelative } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { isJobSaved, toggleSaveJob } from "@/lib/saved";

function CompanyLogo({ job }: { job: Job }) {
  if (job.company_logo_url) {
    return (
      <img
        src={job.company_logo_url}
        alt={job.company_name}
        className="w-16 h-16 rounded-lg object-cover bg-amber-400"
      />
    );
  }
  const initials = job.company_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-16 h-16 rounded-lg bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold text-lg">
      {initials}
    </div>
  );
}

export function JobCard({ job }: { job: Job }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!user) return;
    isJobSaved(user.id, job.id).then(setSaved);
  }, [user, job.id]);

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    setSaved(await toggleSaveJob(user.id, job.id));
  }

  return (
    <Link
      to="/jobs/$id"
      params={{ id: job.id }}
      className="block bg-white border border-border rounded-2xl p-4 hover:border-brand-blue/40 hover:shadow-md transition"
    >
      <div className="flex gap-4">
        <CompanyLogo job={job} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-brand-navy truncate">{job.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{job.company_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {job.location}
              </p>
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
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
              {job.job_type}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
              {job.experience_required}
            </span>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {formatRelative(job.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}