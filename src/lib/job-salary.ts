import type { Job } from "./types";

const DESC_SALARY_TAG = /<!--\s*salary_max:\s*[\d.]+\s*-->/gi;
const INLINE_SALARY_TAG = /__salary_max:\s*[\d.]+/gi;
const RESP_SALARY_PREFIX = "__salary_max:";

export function cleanJobDescription(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(DESC_SALARY_TAG, "")
    .replace(INLINE_SALARY_TAG, "")
    .trim();
}

export function cleanJobResponsibilities(list: string[] | null | undefined): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0 && !item.startsWith(RESP_SALARY_PREFIX));
}

export function getJobSalaryMax(job: {
  salary?: number | null;
  salary_max?: number | null;
  description?: string | null;
  responsibilities?: string[] | null;
}): number | null {
  const min = Number(job.salary) || 0;
  const fromColumn = job.salary_max != null ? Number(job.salary_max) : NaN;
  if (Number.isFinite(fromColumn) && fromColumn > min) return fromColumn;

  for (const raw of Array.isArray(job.responsibilities) ? job.responsibilities : []) {
    const s = String(raw);
    if (s.startsWith(RESP_SALARY_PREFIX)) {
      const n = parseFloat(s.slice(RESP_SALARY_PREFIX.length));
      if (Number.isFinite(n) && n > min) return n;
    }
  }

  const desc = String(job.description ?? "");
  const m = desc.match(/salary_max:\s*([\d.]+)/i);
  if (m) {
    const n = parseFloat(m[1]);
    if (Number.isFinite(n) && n > min) return n;
  }

  return null;
}

export function formatJobSalaryRange(
  salary: number,
  salaryMax: number | null | undefined,
  currency = "SAR",
): string {
  const min = Number(salary) || 0;
  const max = salaryMax != null && salaryMax > min ? salaryMax : null;
  if (max) return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
  return `${min.toLocaleString()} ${currency}`;
}

export function prepareJobView(job: Job) {
  const salaryMax = getJobSalaryMax(job);
  return {
    salaryMax,
    description: cleanJobDescription(job.description),
    responsibilities: cleanJobResponsibilities(job.responsibilities),
    salaryText: formatJobSalaryRange(job.salary, salaryMax, job.salary_currency),
  };
}

export function normalizeJob<T extends Job>(job: T): T {
  const salaryMax = getJobSalaryMax(job);
  return {
    ...job,
    salary_max: salaryMax,
    description: cleanJobDescription(job.description),
    responsibilities: cleanJobResponsibilities(job.responsibilities),
  };
}
