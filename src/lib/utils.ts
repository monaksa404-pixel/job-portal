import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSalaryAmount(value: string): number {
  const n = parseFloat(value.replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
