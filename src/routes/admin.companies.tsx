import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, BadgeCheck, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/companies")({
  head: () => ({ meta: [{ title: "Companies — Admin" }] }),
  component: AdminCompanies,
});

type Co = { id: string; name: string; logo_url: string | null; website: string | null; verified: boolean; status: boolean; sort_order: number };

function AdminCompanies() {
  const [rows, setRows] = useState<Co[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Co | null>(null);
  const [form, setForm] = useState<{ name: string; logo_url: string; website: string; verified: boolean; status: boolean }>({ name: "", logo_url: "", website: "", verified: true, status: true });
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("companies").select("*").order("sort_order");
    setRows((data ?? []) as Co[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEdit(null); setForm({ name: "", logo_url: "", website: "", verified: true, status: true }); setOpen(true); setErr(null); };
  const openEdit = (c: Co) => { setEdit(c); setForm({ name: c.name, logo_url: c.logo_url ?? "", website: c.website ?? "", verified: c.verified, status: c.status }); setOpen(true); setErr(null); };

  const upload = async (f: File) => {
    setUploading(true);
    const path = `${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("avatars").upload(`companies/${path}`, f, { upsert: true });
    if (error) { setErr(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(`companies/${path}`);
    setForm((p) => ({ ...p, logo_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    setErr(null);
    const payload = { name: form.name, logo_url: form.logo_url || null, website: form.website || null, verified: form.verified, status: form.status };
    const q = edit ? supabase.from("companies").update(payload).eq("id", edit.id) : supabase.from("companies").insert(payload);
    const { error } = await q;
    if (error) { setErr(error.message); return; }
    setOpen(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete company?")) return;
    await supabase.from("companies").delete().eq("id", id); await load();
  };

  return (
    <AdminLayout title="Companies" subtitle="Default and admin-added companies" actions={
      <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">
        <Plus className="w-4 h-4" /> New Company
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rows.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-brand-navy">{c.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-brand-navy flex items-center gap-1 truncate">{c.name} {c.verified && <BadgeCheck className="w-4 h-4 text-brand-blue" />}</div>
                <div className="text-xs text-muted-foreground truncate">{c.website ?? "—"}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${c.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{c.status ? "Active" : "Inactive"}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-600" /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No companies yet</div>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-brand-navy text-lg">{edit ? "Edit" : "New"} Company</div>
            {err && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{err}</div>}
            <label className="text-xs font-bold mt-4 block">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <label className="text-xs font-bold mt-3 block">Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <label className="text-xs font-bold mt-3 block">Logo</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                {form.logo_url ? <img src={form.logo_url} className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer px-3 py-2 rounded-lg border border-border text-sm">
                {uploading ? "Uploading…" : "Upload Logo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} /> Verified</label>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} /> Active</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
