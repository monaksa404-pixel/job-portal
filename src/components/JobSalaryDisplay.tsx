import type { Job } from "@/lib/types";
import { readSalaryMax } from "@/lib/job-salary";
import { formatSalaryRange } from "@/lib/utils";

export function JobSalaryDisplay({
  job,
  size = "md",
}: {
  job: Pick<Job, "salary" | "salary_max" | "salary_currency" | "salary_period" | "responsibilities">;
  size?: "sm" | "md" | "lg";
}) {
  const max = readSalaryMax(job);
  const hasRange = max != null && max > job.salary;
  const sizeClass =
    size === "lg"
      ? "text-lg lg:text-xl"
      : size === "sm"
        ? "text-sm"
        : "text-base lg:text-lg";

  return (
    <div className="text-right shrink-0">
      {hasRange ? (
        <>
          <div className={`text-brand-blue font-extrabold whitespace-nowrap ${sizeClass}`}>
            {job.salary.toLocaleString()} – {max!.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {job.salary_currency} · {job.salary_period}
          </div>
        </>
      ) : (
        <>
          <div className={`text-brand-blue font-extrabold whitespace-nowrap ${sizeClass}`}>
            {formatSalaryRange(job.salary, max, job.salary_currency)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">{job.salary_period}</div>
        </>
      )}
    </div>
  );
}
