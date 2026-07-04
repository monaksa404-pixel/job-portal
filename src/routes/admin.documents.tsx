import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchAdminDocuments, openAdminDocument, type AdminDocumentRow } from "@/lib/admin-documents";
import { Download, Eye, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "User Documents — Admin" }] }),
  component: AdminDocuments,
});

function AdminDocuments() {
  const [rows, setRows] = useState<AdminDocumentRow[]>([]);
  const [q, setQ] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDocuments().then(({ rows: r, error }) => {
      setRows(r);
      setLoadErr(error);
    });
  }, []);

  const filtered = rows.filter((r) =>
    !q ||
    r.full_name.toLowerCase().includes(q.toLowerCase()) ||
    (r.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.job_title ?? "").toLowerCase().includes(q.toLowerCase()) ||
    r.doc_label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminLayout
      title="User Documents"
      subtitle={`${rows.length} file(s) from applications & My Documents`}
      actions={
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, job…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
        </div>
      }
    >
      {loadErr && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">{loadErr}</div>
      )}

      <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-brand-navy">
        Shows CV/passport from <strong>job applications</strong> and files from user <strong>My Documents</strong> page.
        Full application form data is under <Link to="/admin/applications" className="text-brand-blue font-semibold hover:underline">Applications</Link> → click the eye icon.
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Applicant</th>
                <th className="text-left px-3 py-3">Job</th>
                <th className="text-left px-3 py-3">Document</th>
                <th className="text-left px-3 py-3">Source</th>
                <th className="text-left px-3 py-3">Uploaded</th>
                <th className="text-left px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No documents yet. They appear when users apply for jobs or upload in My Documents.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email ?? r.phone ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{r.job_title ?? "—"}</td>
                  <td className="px-3 py-3 font-medium text-brand-navy">{r.doc_label}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground capitalize">{r.source.replace(/_/g, " ")}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openAdminDocument(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20">
                        <FileText className="w-3.5 h-3.5" />
                        <Download className="w-3 h-3" />
                        Open
                      </button>
                      {r.application_id && (
                        <Link to="/admin/applications/$id" params={{ id: r.application_id }} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                          <Eye className="w-3.5 h-3.5" /> Application
                        </Link>
                      )}
                    </div>
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
