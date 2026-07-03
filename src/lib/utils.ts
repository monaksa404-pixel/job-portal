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
): number {
  const min = parseSalaryAmount(salaryMin);
  const max = parseSalaryAmount(salaryMax);
  let salary = Math.max(min, max);
  if (salary <= 0) salary = parseSalaryAmount(applicationFee);
  if (salary <= 0) salary = 10;
  return salary;
}
