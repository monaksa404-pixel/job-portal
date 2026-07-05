import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { getJobSalaryMax, formatJobSalaryRange } from "@/lib/job-salary";
import { Plus, Pencil, Trash2, Eye, Search, Briefcase, Star } from "lucide-react";
import { AmountInput } from "@/components/AmountInput";

export const Route = createFileRoute("/admin/jobs/")({
  head: () => ({ meta: [{ title: "Job Management — Admin" }] }),
  component: AdminJobs,
});

type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  location: string | null;
  salary: number | null;
  salary_max?: number | null;
  responsibilities?: string[];
  company_name: string;
  application_fee: number | null;
  rating: number;
  reviews_count: number;
  category: { name: string } | null;
  company: { name: string; logo_url: string | null } | null;
  posted_by: string;
};

function AdminJobs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    let qq = supabase
      .from("jobs")
      .select("id, title, status, created_at, location, salary, salary_max, responsibilities, company_name, application_fee, rating, reviews_count, posted_by, category:categories(name), company:companies(name, logo_url)")
      .order("created_at", { ascending: false });
    if (status) qq = qq.eq("status", status);
    const { data } = await qq;
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => { load(); }, [status]);

  const filtered = rows.filter((r) =>
    !q ||
    r.title.toLowerCase().includes(q.toLowerCase()) ||
    (r.company?.name ?? r.company_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const remove = async (id: string) => {
    if (!confirm("Delete this job? Applications will also be removed.")) return;
    await supabase.from("jobs").delete().eq("id", id);
    load();
  };

  const toggle = async (id: string, s: string) => {
    await supabase.from("jobs").update({ status: s === "active" ? "closed" : "active" }).eq("id", id);
    load();
  };

  const saveReviews = async (id: string, rating: number, reviews_count: number) => {
    await supabase.from("jobs").update({
      rating: Math.min(5, Math.max(1, rating)),
      reviews_count: Math.max(0, Math.floor(reviews_count)),
    }).eq("id", id);
    load();
  };

  return (
    <AdminLayout
      title="Job Management"
      subtitle="All published jobs"
      actions={
        <Link to="/admin/jobs/new" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add New Job
        </Link>
      }
    >
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs by title or company…" className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-border mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Job</th>
                <th className="text-left px-3 py-3 font-medium">Category</th>
                <th className="text-left px-3 py-3 font-medium">Company</th>
                <th className="text-left px-3 py-3 font-medium">Salary</th>
                <th className="text-left px-3 py-3 font-medium">Fee</th>
                <th className="text-left px-3 py-3 font-medium">Reviews</th>
                <th className="text-left px-3 py-3 font-medium">Posted On</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No jobs found</td></tr>
              )}
              {filtered.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-brand-blue" /> {j.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{j.location ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{j.category?.name ?? "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {j.company?.logo_url && <img src={j.company.logo_url} alt="" className="w-5 h-5 rounded" />}
                      {j.company?.name ?? j.company_name ?? (j.posted_by === "admin" ? "Posted by Admin" : "—")}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {j.salary
                      ? formatJobSalaryRange(j.salary ?? 0, getJobSalaryMax(j))
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{j.application_fee ? `${j.application_fee} SAR` : "Free"}</td>
                  <td className="px-3 py-3">
                    <ReviewsCell
                      rating={j.rating ?? 4.5}
                      reviewsCount={j.reviews_count ?? 0}
                      onSave={(rating, reviews_count) => saveReviews(j.id, rating, reviews_count)}
                    />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggle(j.id, j.status)} className={`text-[10px] font-semibold px-2 py-1 rounded-full ${j.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {j.status}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <a href={`/jobs/${j.id}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-secondary"><Eye className="w-4 h-4 text-muted-foreground" /></a>
                      <Link to="/admin/jobs/$id/edit" params={{ id: j.id }} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></Link>
                      <button onClick={() => remove(j.id)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-600" /></button>
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

function ReviewsCell({ rating, reviewsCount, onSave }: { rating: number; reviewsCount: number; onSave: (rating: number, reviews_count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState(rating);
  const [c, setC] = useState(reviewsCount);

  return (
    <div className="relative">
      <button type="button" onClick={() => { setR(rating); setC(reviewsCount); setOpen((v) => !v); }} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-blue">
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        {rating} · {reviewsCount}
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-border rounded-xl shadow-lg p-3 w-44">
          <div className="text-[10px] font-bold text-muted-foreground mb-2">Edit Reviews</div>
          <label className="text-[10px] font-bold">Rating (1–5)</label>
          <input type="number" min={1} max={5} step={0.1} value={r} onChange={(e) => setR(Number(e.target.value) || 4.5)} className="mt-0.5 w-full px-2 py-1 rounded border border-border text-xs mb-2" />
          <label className="text-[10px] font-bold">Review Count</label>
          <AmountInput value={c} onChange={setC} className="mt-0.5 w-full px-2 py-1 rounded border border-border text-xs" />
          <div className="flex gap-1 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-1 text-xs rounded border border-border">Cancel</button>
            <button type="button" onClick={() => { onSave(r, c); setOpen(false); }} className="flex-1 py-1 text-xs rounded bg-brand-blue text-white font-semibold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
