import type { Job } from "@/lib/types";
import { formatJobSalaryRange, getJobSalaryMax } from "@/lib/job-salary";

export function JobSalaryDisplay({
  job,
  size = "md",
  align = "right",
}: {
  job: Pick<Job, "salary" | "salary_max" | "salary_currency" | "salary_period" | "description" | "responsibilities" | "added_companies">;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}) {
  const max =
    job.salary_max != null && Number(job.salary_max) > Number(job.salary)
      ? Number(job.salary_max)
      : getJobSalaryMax(job);
  const hasRange = max != null && max > Number(job.salary);
  const sizeClass =
    size === "lg" ? "text-lg lg:text-xl" : size === "sm" ? "text-sm" : "text-base lg:text-lg";
  const alignClass = align === "left" ? "text-left" : "text-right";
  const wrapClass = size === "sm" ? "whitespace-normal break-words" : "whitespace-nowrap";

  if (hasRange) {
    return (
      <div className={`max-w-full min-w-0 ${alignClass}`}>
        <div className={`text-brand-blue font-extrabold ${wrapClass} ${sizeClass}`}>
          {Number(job.salary).toLocaleString()} – {max.toLocaleString()}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground break-words">
          {job.salary_currency} · {job.salary_period}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-full min-w-0 ${alignClass}`}>
      <div className={`text-brand-blue font-extrabold ${wrapClass} ${sizeClass}`}>
        {formatJobSalaryRange(job.salary, max, job.salary_currency)}
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground break-words">{job.salary_period}</div>
    </div>
  );
}
