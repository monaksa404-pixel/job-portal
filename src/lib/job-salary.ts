import type { Job } from "./types";

const SALARY_MAX_META = "__salary_max:";
const DESC_SALARY_RE = /<!--\s*salary_max:([\d.]+)\s*-->/;

function pickUrl(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) {
    const s = v?.trim();
    if (s) return s;
  }
  return null;
}

export function readSalaryMax(job: {
  salary?: number;
  salary_max?: number | null;
  responsibilities?: string[] | null;
  description?: string | null;
}): number | null {
  const baseSalary = Number(job.salary) || 0;
  const col = job.salary_max;
  if (col != null && Number(col) > 0) {
    const n = Number(col);
    if (!baseSalary || n > baseSalary) return n;
  }

  const tag = (job.responsibilities ?? []).find((r) => String(r).startsWith(SALARY_MAX_META));
  if (tag) {
    const n = parseFloat(String(tag).slice(SALARY_MAX_META.length));
    if (Number.isFinite(n) && n > 0 && (!baseSalary || n > baseSalary)) return n;
  }

  const desc = job.description ?? "";
  const m = desc.match(DESC_SALARY_RE);
  if (m) {
    const n = parseFloat(m[1]);
    if (Number.isFinite(n) && n > 0 && (!baseSalary || n > baseSalary)) return n;
  }

  return null;
}

export function stripSalaryFromDescription(description: string): string {
  return description.replace(DESC_SALARY_RE, "").trimEnd();
}

export function packSalaryMeta(responsibilities: string[] | null | undefined, salaryMax: number | null): string[] {
  const kept = (responsibilities ?? []).filter((r) => !r.startsWith(SALARY_MAX_META));
  if (salaryMax != null && salaryMax > 0) kept.push(`${SALARY_MAX_META}${salaryMax}`);
  return kept;
}

export function packDescriptionSalary(description: string, salaryMax: number | null): string {
  const clean = stripSalaryFromDescription(description);
  if (salaryMax != null && salaryMax > 0) return `${clean}<!--salary_max:${salaryMax}-->`;
  return clean;
}

export function visibleResponsibilities(responsibilities: string[] | null | undefined): string[] {
  return (responsibilities ?? []).filter((r) => !r.startsWith(SALARY_MAX_META));
}

export function normalizeJob<T extends Job>(job: T): T {
  const salary_max = readSalaryMax(job);
  return {
    ...job,
    salary_max,
    description: stripSalaryFromDescription(job.description ?? ""),
    responsibilities: visibleResponsibilities(job.responsibilities),
  };
}

export function jobDisplayFields(job: Job) {
  const salary_max = job.salary_max ?? readSalaryMax(job);
  return {
    salary_max,
    description: stripSalaryFromDescription(job.description ?? ""),
    responsibilities: visibleResponsibilities(job.responsibilities),
    salaryLabel: salaryRangeLabel(job.salary, salary_max, job.salary_currency),
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

export function getJobCompanyInfo(job: Job): {
  name: string;
  logoUrl: string | null;
  website: string | null;
  verified: boolean;
} {
  const company = job.company ?? null;
  const added = job.added_companies ?? [];
  const byId = job.company_id ? added.find((c) => c.id === job.company_id) : null;
  const byName = added.find((c) => c.name.toLowerCase() === (job.company_name ?? "").toLowerCase());

  const jobName = job.company_name?.trim();
  const branded = added.find((c) => c.name?.trim() && !["Company", "Job Expert"].includes(c.name.trim()));

  const name =
    jobName && !["Job Expert", "Company"].includes(jobName)
      ? jobName
      : branded?.name ?? company?.name ?? byId?.name ?? byName?.name ?? jobName ?? "Company";

  return {
    name,
    logoUrl: pickUrl(job.company_logo_url, branded?.logo_url, company?.logo_url, byId?.logo_url, byName?.logo_url),
    website: pickUrl(job.company_website, branded?.website, company?.website, byId?.website, byName?.website),
    verified: company?.verified ?? job.verified,
  };
}
