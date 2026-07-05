import type { Job } from "./types";

const SALARY_MAX_META = "__salary_max:";

export function readSalaryMax(job: {
  salary_max?: number | null;
  responsibilities?: string[] | null;
}): number | null {
  const col = job.salary_max;
  if (col != null && Number(col) > 0) return Number(col);
  const tag = (job.responsibilities ?? []).find((r) => r.startsWith(SALARY_MAX_META));
  if (!tag) return null;
  const n = parseFloat(tag.slice(SALARY_MAX_META.length));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function packSalaryMeta(responsibilities: string[] | null | undefined, salaryMax: number | null): string[] {
  const kept = (responsibilities ?? []).filter((r) => !r.startsWith(SALARY_MAX_META));
  if (salaryMax != null && salaryMax > 0) kept.push(`${SALARY_MAX_META}${salaryMax}`);
  return kept;
}

export function visibleResponsibilities(responsibilities: string[] | null | undefined): string[] {
  return (responsibilities ?? []).filter((r) => !r.startsWith(SALARY_MAX_META));
}

export function normalizeJob<T extends Job>(job: T): T {
  const salary_max = readSalaryMax(job);
  return {
    ...job,
    salary_max,
    responsibilities: visibleResponsibilities(job.responsibilities),
  };
}

export function salaryRangeLabel(
  salary: number,
  salaryMax?: number | null,
  currency = "SAR",
): string {
  const max = salaryMax != null && salaryMax > salary ? salaryMax : null;
  if (max) return `${salary.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
  return `${salary.toLocaleString()} ${currency}`;
}
