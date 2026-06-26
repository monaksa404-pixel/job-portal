import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/my-documents")({
  head: () => ({ meta: [{ title: "My Documents — Job Expert" }] }),
  component: () => <DashboardLayout><DocsPage /></DashboardLayout>,
});

type DocKind = "cv" | "passport" | "other";
type Doc = { id: string; user_id: string; kind: DocKind; name: string; url: string; size_bytes: number; created_at: string };

function DocsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_documents").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as Doc[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function upload(file: File, kind: DocKind) {
    if (!user) return;
    setBusy(true);
    const path = `${user.id}/${kind}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (!error) {
      await supabase.from("user_documents").insert({ user_id: user.id, kind, name: file.name, url: path, size_bytes: file.size });
      load();
    }
    setBusy(false);
  }

  async function remove(d: Doc) {
    await supabase.storage.from("documents").remove([d.url]);
    await supabase.from("user_documents").delete().eq("id", d.id);
    load();
  }

  function open(d: Doc) {
    supabase.storage.from("documents").createSignedUrl(d.url, 60).then(({ data }) => {
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><FileText className="w-5 h-5 text-brand-blue" /> My Documents</h1>
      <p className="text-sm text-muted-foreground">Manage your CV, passport, and other documents.</p>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <UploadCard label="Upload CV" type="cv" onUpload={upload} busy={busy} />
        <UploadCard label="Upload Passport" type="passport" onUpload={upload} busy={busy} />
        <UploadCard label="Upload Other" type="other" onUpload={upload} busy={busy} />
      </div>

      <div className="mt-5 bg-white border border-border rounded-2xl divide-y divide-border">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No documents uploaded.</div>
        ) : rows.map((d) => (
          <div key={d.id} className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue grid place-items-center"><FileText className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-navy truncate">{d.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{d.kind} · {new Date(d.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={() => open(d)} className="p-2 rounded-lg hover:bg-secondary text-brand-blue"><ExternalLink className="w-4 h-4" /></button>
            <button onClick={() => remove(d)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadCard({ label, type, onUpload, busy }: { label: string; type: DocKind; onUpload: (f: File, t: DocKind) => void; busy: boolean }) {
  return (
    <label className={`border-2 border-dashed border-border rounded-2xl p-5 text-center flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary ${busy ? "opacity-50 pointer-events-none" : ""}`}>
      <Upload className="w-6 h-6 text-brand-blue" />
      <span className="text-sm font-semibold text-brand-navy">{label}</span>
      <span className="text-[11px] text-muted-foreground">PDF, PNG, JPG up to 10MB</span>
      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], type)} />
    </label>
  );
}