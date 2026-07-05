import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSalaryAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : 0;
  const n = parseFloat(String(value ?? "").replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function resolveJobSalary(
  salaryMin: string,
  salaryMax: string,
  applicationFee: number,
): { salary: number; salary_max: number | null } {
  const min = parseSalaryAmount(salaryMin);
  const max = parseSalaryAmount(salaryMax);
  let salary = min > 0 ? min : max > 0 ? max : parseSalaryAmount(applicationFee);
  if (salary <= 0) salary = 10;
  const salary_max = max > 0 && max !== min ? max : null;
  return { salary, salary_max };
}

export function formatSalaryRange(salary: number, salaryMax?: number | null, currency = "SAR"): string {
  if (salaryMax && salaryMax > salary) {
    return `${salary.toLocaleString()} – ${salaryMax.toLocaleString()} ${currency}`;
  }
  return `${salary.toLocaleString()} ${currency}`;
}
