import { createFileRoute } from '@tanstack/react-router'
import { AmountInput } from "@/components/AmountInput";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin" }] }),
  component: AdminCategories,
});

type Cat = { id: string; name: string; slug: string; icon: string | null; status: boolean; sort_order: number };

function AdminCategories() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Cat | null>(null);
  const [form, setForm] = useState<{ name: string; icon: string; sort_order: number; status: boolean }>({ name: "", icon: "Briefcase", sort_order: 99, status: true });
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as Cat[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEdit(null); setForm({ name: "", icon: "Briefcase", sort_order: rows.length + 1, status: true }); setOpen(true); setErr(null); };
  const openEdit = (c: Cat) => { setEdit(c); setForm({ name: c.name, icon: c.icon ?? "Briefcase", sort_order: c.sort_order, status: c.status }); setOpen(true); setErr(null); };

  const save = async () => {
    setErr(null);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (edit) {
      const { error } = await supabase.from("categories").update({ name: form.name, slug, icon: form.icon, sort_order: form.sort_order, status: form.status }).eq("id", edit.id);
      if (error) { setErr(error.message); return; }
    } else {
      const { error } = await supabase.from("categories").insert({ name: form.name, slug, icon: form.icon, sort_order: form.sort_order, status: form.status });
      if (error) { setErr(error.message); return; }
    }
    setOpen(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id); await load();
  };

  return (
    <AdminLayout title="Categories" subtitle="Manage job categories" actions={
      <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">
        <Plus className="w-4 h-4" /> New Category
      </button>
    }>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs text-muted-foreground">
            <tr><th className="text-left px-5 py-3 font-medium">Name</th><th className="text-left px-3 py-3 font-medium">Slug</th><th className="text-left px-3 py-3 font-medium">Icon</th><th className="text-left px-3 py-3 font-medium">Order</th><th className="text-left px-3 py-3 font-medium">Status</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-5 py-3 font-semibold text-brand-navy">{c.name}</td>
                <td className="px-3 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-3 py-3 text-muted-foreground">{c.icon}</td>
                <td className="px-3 py-3">{c.sort_order}</td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{c.status ? "Active" : "Inactive"}</span></td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-600" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-brand-navy text-lg">{edit ? "Edit" : "New"} Category</div>
            {err && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{err}</div>}
            <label className="text-xs font-bold mt-4 block">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <label className="text-xs font-bold mt-3 block">Icon (lucide name)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Briefcase" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-bold block">Sort Order</label>
                <AmountInput value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold block">Status</label>
                <select value={String(form.status)} onChange={(e) => setForm({ ...form, status: e.target.value === "true" })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm">
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </div>
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
