import { supabase } from "@/integrations/supabase/client";

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  nationality: string | null;
  gender: string | null;
  created_at: string;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const [{ data: profiles }, { data: apps }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("user_id, full_name, email, phone, nationality, created_at").order("created_at", { ascending: false }),
  ]);

  const map = new Map<string, AdminUserRow>();
  for (const p of profiles ?? []) {
    map.set(p.id, p as AdminUserRow);
  }
  for (const a of apps ?? []) {
    const existing = map.get(a.user_id);
    if (!existing) {
      map.set(a.user_id, {
        id: a.user_id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        country: null,
        nationality: a.nationality ?? null,
        gender: null,
        created_at: a.created_at,
      });
    } else {
      if (!existing.email && a.email) existing.email = a.email;
      if (!existing.full_name && a.full_name) existing.full_name = a.full_name;
      if (!existing.phone && a.phone) existing.phone = a.phone;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
