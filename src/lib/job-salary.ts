import type { Job } from "./types";

export const SALARY_META_ID = "__salary_max__";

const DESC_SALARY_TAG = /<!--\s*salary_max:\s*[\d.]+\s*-->/gi;
const INLINE_SALARY_TAG = /__salary_max:\s*[\d.]+/gi;
const RESP_SALARY_PREFIX = "__salary_max:";

type AddedCo = NonNullable<Job["added_companies"]>[number] & { salary_max?: number };

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

export function filterDisplayCompanies(added: Job["added_companies"]): AddedCo[] {
  return (added ?? []).filter((c) => c.id !== SALARY_META_ID);
}

export function readSalaryMaxFromAdded(added: Job["added_companies"]): number | null {
  const meta = (added ?? []).find((c) => c.id === SALARY_META_ID) as AddedCo | undefined;
  if (meta?.salary_max != null && Number(meta.salary_max) > 0) return Number(meta.salary_max);
  for (const c of added ?? []) {
    const row = c as AddedCo;
    if (row.salary_max != null && Number(row.salary_max) > 0) return Number(row.salary_max);
  }
  return null;
}

export function packAddedCompaniesWithSalary(
  companies: AddedCo[],
  salaryMax: number | null,
): AddedCo[] {
  let list = companies.filter((c) => c.id !== SALARY_META_ID);
  if (salaryMax != null && salaryMax > 0) {
    if (list.length > 0) {
      list = [{ ...list[0], salary_max: salaryMax }, ...list.slice(1)];
    }
    list.push({
      id: SALARY_META_ID,
      name: "",
      logo_url: null,
      website: null,
      salary_max: salaryMax,
    });
  }
  return list;
}

export function getJobSalaryMax(job: {
  salary?: number | null;
  salary_max?: number | null;
  description?: string | null;
  responsibilities?: string[] | null;
  added_companies?: Job["added_companies"];
}): number | null {
  const min = Number(job.salary) || 0;

  if (job.salary_max != null) {
    const col = Number(job.salary_max);
    if (Number.isFinite(col) && col > min) return col;
  }

  const fromAdded = readSalaryMaxFromAdded(job.added_companies);
  if (fromAdded != null && fromAdded > min) return fromAdded;

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
    added_companies: filterDisplayCompanies(job.added_companies),
  };
}
