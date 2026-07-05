import { createFileRoute } from '@tanstack/react-router'
import { AmountInput } from "@/components/AmountInput";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin" }] }),
  component: AdminCategories,
});

type Cat = { id: string; name: string; slug: string; icon: string | null; color: string; logo_url: string | null; status: boolean; sort_order: number };

function AdminCategories() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Cat | null>(null);
  const [form, setForm] = useState<{ name: string; icon: string; color: string; logo_url: string; sort_order: number; status: boolean }>({
    name: "", icon: "briefcase", color: "blue", logo_url: "", sort_order: 99, status: true,
  });
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as Cat[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEdit(null);
    setForm({ name: "", icon: "briefcase", color: "blue", logo_url: "", sort_order: rows.length + 1, status: true });
    setOpen(true);
    setErr(null);
  };

  const openEdit = (c: Cat) => {
    setEdit(c);
    setForm({
      name: c.name,
      icon: c.icon ?? "briefcase",
      color: c.color ?? "blue",
      logo_url: c.logo_url ?? "",
      sort_order: c.sort_order,
      status: c.status,
    });
    setOpen(true);
    setErr(null);
  };

  const uploadLogo = async (f: File) => {
    setUploading(true);
    setErr(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setErr("Please sign in again.");
      setUploading(false);
      return;
    }
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category";
    const filePath = `${uid}/categories/${slug}-${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, f, { upsert: true });
    if (error) {
      setErr(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setForm((p) => ({ ...p, logo_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    setErr(null);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name: form.name,
      slug,
      icon: form.icon,
      color: form.color,
      logo_url: form.logo_url || null,
      sort_order: form.sort_order,
      status: form.status,
    };
    if (edit) {
      const { error } = await supabase.from("categories").update(payload).eq("id", edit.id);
      if (error) { setErr(error.message); return; }
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { setErr(error.message); return; }
    }
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    await load();
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
            <tr>
              <th className="text-left px-5 py-3 font-medium">Logo</th>
              <th className="text-left px-3 py-3 font-medium">Name</th>
              <th className="text-left px-3 py-3 font-medium">Order</th>
              <th className="text-left px-3 py-3 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-5 py-3">
                  <CategoryIcon name={c.icon ?? "briefcase"} color={c.color} logoUrl={c.logo_url} size={20} className="w-10 h-10" />
                </td>
                <td className="px-3 py-3 font-semibold text-brand-navy">{c.name}</td>
                <td className="px-3 py-3">{c.sort_order}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {c.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-600" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-brand-navy text-lg">{edit ? "Edit" : "New"} Category</div>
            {err && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{err}</div>}

            <label className="text-xs font-bold mt-4 block">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />

            <label className="text-xs font-bold mt-3 block">Category Logo</label>
            <div className="mt-1 flex items-center gap-3">
              <CategoryIcon name={form.icon} color={form.color} logoUrl={form.logo_url || null} size={22} className="w-16 h-16 shrink-0" />
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm w-fit hover:bg-secondary/60">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Upload Logo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
                {form.logo_url && (
                  <button type="button" onClick={() => setForm({ ...form, logo_url: "" })} className="text-xs text-rose-600 text-left">
                    Remove logo (use default icon)
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG, WEBP or SVG. Shown on home & categories page. Leave empty to use the default icon.</p>

            <label className="text-xs font-bold mt-3 block">Default Icon (lucide name)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="briefcase" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />

            <label className="text-xs font-bold mt-3 block">Icon Color</label>
            <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm">
              {["teal", "blue", "yellow", "purple", "orange", "pink", "green", "red", "amber", "gray"].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>

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
              <button onClick={save} disabled={uploading} className="px-4 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
