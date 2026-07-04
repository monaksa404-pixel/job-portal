import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { getApplicationDocUrl } from "@/lib/storage-url";
import { Download, Eye, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "User Documents — Admin" }] }),
  component: AdminDocuments,
});

type Row = {
  id: string;
  application_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  cv_url: string | null;
  passport_url: string | null;
  created_at: string;
  job: { title: string } | null;
};

function AdminDocuments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("applications")
      .select("id, application_id, full_name, email, phone, cv_url, passport_url, created_at, job:jobs(title)")
      .or("cv_url.not.is.null,passport_url.not.is.null")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, []);

  const filtered = rows.filter((r) =>
    !q ||
    r.full_name.toLowerCase().includes(q.toLowerCase()) ||
    (r.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.job?.title ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminLayout
      title="User Documents"
      subtitle="CV and documents uploaded by applicants"
      actions={
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, job…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Applicant</th>
                <th className="text-left px-3 py-3">Job</th>
                <th className="text-left px-3 py-3">CV / Resume</th>
                <th className="text-left px-3 py-3">Other Documents</th>
                <th className="text-left px-3 py-3">Applied</th>
                <th className="text-left px-3 py-3">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No uploaded documents yet</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email ?? r.phone}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{r.job?.title ?? "—"}</td>
                  <td className="px-3 py-3"><DocBtn bucket="cv" path={r.cv_url} label="CV" /></td>
                  <td className="px-3 py-3"><DocBtn bucket="passport" path={r.passport_url} label="Document" /></td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <Link to="/admin/applications/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                      <Eye className="w-3.5 h-3.5" /> Application
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function DocBtn({ bucket, path, label }: { bucket: "cv" | "passport"; path: string | null; label: string }) {
  if (!path) return <span className="text-xs text-muted-foreground">—</span>;

  const open = async () => {
    const url = await getApplicationDocUrl(bucket, path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" onClick={open} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20">
      <FileText className="w-3.5 h-3.5" />
      <Download className="w-3 h-3" />
      {label}
    </button>
  );
}
