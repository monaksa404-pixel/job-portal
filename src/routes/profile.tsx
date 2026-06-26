import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Job Expert" }] }),
  component: () => <DashboardLayout><ProfilePage /></DashboardLayout>,
});

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setP((data as Profile) ?? { id: user.id, full_name: "", email: user.email ?? "", phone: "", nationality: "", country: "", gender: null, date_of_birth: null, avatar_url: null });
    });
  }, [user]);

  if (!p) return <div className="text-sm text-muted-foreground">Loading…</div>;

  async function save() {
    if (!user || !p) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("profiles").upsert({ ...p, id: user.id, updated_at: new Date().toISOString() });
    setBusy(false);
    setMsg(error ? error.message : "Profile updated.");
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setMsg(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setP({ ...p!, avatar_url: data.publicUrl });
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><User className="w-5 h-5 text-brand-blue" /> Profile</h1>
      <p className="text-sm text-muted-foreground">Keep your personal information up to date.</p>

      <div className="mt-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-2xl font-bold text-brand-navy">
          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.full_name?.[0] ?? "?")}
        </div>
        <label className="px-3 py-2 rounded-lg border border-border cursor-pointer text-sm font-semibold flex items-center gap-2 hover:bg-secondary">
          <Upload className="w-4 h-4" /> Upload photo
          <input type="file" accept="image/*" className="hidden"
                 onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </label>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" value={p.full_name ?? ""} onChange={(v) => setP({ ...p, full_name: v })} />
        <Field label="Email" value={p.email ?? ""} onChange={(v) => setP({ ...p, email: v })} />
        <Field label="Phone" value={p.phone ?? ""} onChange={(v) => setP({ ...p, phone: v })} />
        <Field label="Nationality" value={p.nationality ?? ""} onChange={(v) => setP({ ...p, nationality: v })} />
        <Field label="Country" value={p.country ?? ""} onChange={(v) => setP({ ...p, country: v })} />
        <div>
          <label className="block text-xs font-semibold text-brand-navy mb-1">Gender</label>
          <select value={p.gender ?? ""} onChange={(e) => setP({ ...p, gender: (e.target.value || null) as Profile["gender"] })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <Field label="Date of Birth" type="date" value={p.date_of_birth ?? ""} onChange={(v) => setP({ ...p, date_of_birth: v || null })} />
      </div>

      <button onClick={save} disabled={busy}
              className="mt-6 px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold disabled:opacity-60">
        {busy ? "Saving…" : "Save Changes"}
      </button>
      {msg && <div className="mt-3 text-sm text-muted-foreground">{msg}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-navy mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white" />
    </div>
  );
}