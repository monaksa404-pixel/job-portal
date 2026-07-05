import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchAdminApplicationsFull, openApplicationDoc, openAdminDocument } from "@/lib/admin-documents";
import { Eye, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "User Applications & Data — Admin" }] }),
  component: AdminDocuments,
});

function AdminDocuments() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchAdminApplicationsFull>>["rows"]>([]);
  const [q, setQ] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminApplicationsFull().then(({ rows: r, error }) => {
      setRows(r);
      setLoadErr(error);
    });
  }, []);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay = [r.full_name, r.email, r.phone, r.job?.title, r.nationality, r.current_location, r.application_id].join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AdminLayout
      title="User Applications & Data"
      subtitle={`${rows.length} application(s) — full form data from users`}
      actions={
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, job…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
        </div>
      }
    >
      {loadErr && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{loadErr}</div>}

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center text-muted-foreground">
            No applications yet. Data appears here when users submit the job application form.
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold text-brand-navy text-lg">{r.full_name}</div>
                <div className="text-sm text-muted-foreground">{r.email ?? "—"} · {r.phone}</div>
                <div className="text-xs text-muted-foreground mt-1">ID: {r.application_id} · {r.job?.title ?? "Job"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${r.payment_status === "verified" ? "bg-emerald-100 text-emerald-800" : r.payment_status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                  Payment {r.payment_status}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-brand-blue capitalize">
                  {r.application_status.replace(/_/g, " ")}
                </span>
                <Link to="/admin/applications/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-blue text-white text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" /> Full Detail
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
              <Cell label="Nationality" v={r.nationality} />
              <Cell label="Location" v={r.current_location} />
              <Cell label="Gender" v={r.gender} />
              <Cell label="Date of Birth" v={r.date_of_birth} />
              <Cell label="Marital Status" v={r.marital_status} />
              <Cell label="In Saudi Arabia" v={r.in_saudi_arabia == null ? null : r.in_saudi_arabia ? "Yes" : "No"} />
              <Cell label="Experience" v={r.experience} />
              <Cell label="Iqama Status" v={r.iqama_status} />
              <Cell label="Iqama Profession" v={r.iqama_profession} />
              <Cell label="Iqama Number" v={r.iqama_number} />
              <Cell label="Iqama Expiry" v={r.iqama_expiry} />
              <Cell label="Amount Paid" v={`${r.amount_paid} SAR`} />
              <Cell label="STC PIN" v={r.recharge_pin} mono />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {r.cv_url ? (
                <button type="button" onClick={() => openApplicationDoc("cv", r.cv_url!)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20">
                  <FileText className="w-3.5 h-3.5" /> CV / Resume
                </button>
              ) : (
                <span className="text-xs text-muted-foreground px-2 py-2">CV: not uploaded</span>
              )}
              {r.passport_url ? (
                <button type="button" onClick={() => openApplicationDoc("passport", r.passport_url!)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20">
                  <FileText className="w-3.5 h-3.5" /> Additional Document
                </button>
              ) : (
                <span className="text-xs text-muted-foreground px-2 py-2">Extra doc: not uploaded</span>
              )}
              {(r.user_documents ?? []).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openAdminDocument({
                    id: d.id, source: "user_document", user_id: r.user_id,
                    full_name: r.full_name, email: r.email, phone: r.phone, job_title: r.job?.title ?? null,
                    doc_label: `${d.kind}: ${d.name}`, storage_bucket: "documents", storage_path: d.url,
                    created_at: r.created_at,
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100"
                >
                  <FileText className="w-3.5 h-3.5" /> {d.kind}: {d.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function Cell({ label, v, mono }: { label: string; v: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-semibold text-brand-navy text-xs mt-0.5 ${mono ? "font-mono" : ""}`}>{v ?? "—"}</div>
    </div>
  );
}
