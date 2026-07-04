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
  applications_count?: number;
};

export async function fetchAdminUsers(): Promise<{ users: AdminUserRow[]; error: string | null }> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("admin_get_users");

  if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
    return { users: rpcData as AdminUserRow[], error: null };
  }

  if (rpcError) {
    console.warn("admin_get_users RPC failed, using client merge:", rpcError.message);
  }

  const [{ data: profiles, error: pErr }, { data: apps, error: aErr }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("user_id, full_name, email, phone, nationality, created_at").order("created_at", { ascending: false }),
  ]);

  if (pErr) console.error("profiles load:", pErr.message);
  if (aErr) console.error("applications load:", aErr.message);

  const map = new Map<string, AdminUserRow>();
  const appCounts = new Map<string, number>();
  for (const a of apps ?? []) {
    appCounts.set(a.user_id, (appCounts.get(a.user_id) ?? 0) + 1);
  }
  for (const p of profiles ?? []) {
    map.set(p.id, { ...(p as AdminUserRow), applications_count: appCounts.get(p.id) ?? 0 });
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
        applications_count: appCounts.get(a.user_id) ?? 1,
      });
    } else {
      if (!existing.email && a.email) existing.email = a.email;
      if (!existing.full_name && a.full_name) existing.full_name = a.full_name;
      if (!existing.phone && a.phone) existing.phone = a.phone;
      existing.applications_count = appCounts.get(a.user_id) ?? 0;
    }
  }

  const users = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const err = rpcError && pErr && aErr
    ? "Could not load users. Run the latest SQL patch in Supabase (admin_get_users + RLS policies)."
    : rpcError && users.length === 0
      ? `Limited user list: ${rpcError.message}. Run admin SQL patch in Supabase.`
      : null;

  return { users, error: err };
}
