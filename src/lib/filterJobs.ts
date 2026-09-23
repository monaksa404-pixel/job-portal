import type { Job } from "./types";

export function filterJobs(jobs: Job[], q: string, categoryId?: string, location?: string): Job[] {
  const query = q.trim().toLowerCase();
  const loc = location?.trim().toLowerCase() ?? "";
  const cat = categoryId?.trim() ?? "";
  return jobs.filter((j) => {
    const haystack = [j.title, j.company_name, j.location, j.category?.name ?? ""].join(" ").toLowerCase();
    const matchesQ = !query || haystack.includes(query);
    const matchesCat = !cat || String(j.category_id ?? "") === cat || j.category?.id === cat;
    const matchesLoc = !loc || j.location.toLowerCase().includes(loc);
    return matchesQ && matchesCat && matchesLoc;
  });
}
