import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminUsers } from "@/lib/admin-users";
import { Search, Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  country: string | null;
  gender: string | null;
  created_at: string;
  applications_count?: number;
};

function AdminUsers() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = async () => {
    const { users, error } = await fetchAdminUsers();
    setRows(users);
    setLoadErr(error);
    const { data: r } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    setAdmins(new Set((r ?? []).map((x: { user_id: string }) => x.user_id)));
  };
  useEffect(() => { load(); }, []);

  const toggleAdmin = async (id: string, isAdmin: boolean) => {
    if (isAdmin) await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    else await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    await load();
  };

  const filtered = rows.filter((r) =>
    !q ||
    (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.phone ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminLayout title="Users" subtitle={`${rows.length} users (signups + applicants)`} actions={
      <div className="hidden md:block relative w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
      </div>
    }>
      {loadErr && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          {loadErr}
        </div>
      )}

      <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-brand-navy">
        <span className="font-semibold">Where to see user details:</span>{" "}
        <Link to="/admin/applications" className="text-brand-blue font-semibold hover:underline">Applications</Link>
        {" "}→ click eye icon for full form data.{" "}
        <Link to="/admin/documents" className="text-brand-blue font-semibold hover:underline">User Documents</Link>
        {" "}→ CV &amp; uploads.
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-3 py-3">Email</th>
                <th className="text-left px-3 py-3">Phone</th>
                <th className="text-left px-3 py-3">Applications</th>
                <th className="text-left px-3 py-3">Joined</th>
                <th className="text-left px-3 py-3">Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isAdmin = admins.has(p.id);
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold text-brand-navy">{p.full_name ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-3 py-3">
                      {(p.applications_count ?? 0) > 0 ? (
                        <Link to="/admin/applications" className="text-brand-blue font-semibold text-xs hover:underline">
                          {p.applications_count} application{p.applications_count === 1 ? "" : "s"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isAdmin ? "bg-brand-blue text-white" : "bg-secondary text-foreground"}`}>
                        {isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => toggleAdmin(p.id, isAdmin)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-secondary">
                        {isAdmin ? <><ShieldOff className="w-3.5 h-3.5" /> Revoke Admin</> : <><Shield className="w-3.5 h-3.5" /> Make Admin</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
