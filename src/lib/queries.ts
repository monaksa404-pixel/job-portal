import { supabase } from "@/integrations/supabase/client";
import type { Category, Job } from "./types";
import { normalizeJob } from "./job-salary";

const JOB_SELECT = `
  *,
  category:categories(*),
  company:companies(name, logo_url, website, verified)
`;

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("status", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchCategoriesWithCounts(): Promise<Category[]> {
  const cats = await fetchCategories();
  const { data: counts } = await supabase
    .from("jobs")
    .select("category_id")
    .eq("status", "active");
  const map = new Map<string, number>();
  (counts ?? []).forEach((r: { category_id: string | null }) => {
    if (!r.category_id) return;
    map.set(r.category_id, (map.get(r.category_id) ?? 0) + 1);
  });
  return cats.map((c) => ({ ...c, jobs_count: map.get(c.id) ?? 0 }));
}

export async function fetchRecentJobs(limit = 6): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Job[]).map(normalizeJob);
}

export async function fetchAllJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Job[]).map(normalizeJob);
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeJob(data as Job) : null;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function formatRelative(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const dd = Math.floor(h / 24);
  return `${dd} day${dd > 1 ? "s" : ""} ago`;
}
