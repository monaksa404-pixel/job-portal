import { supabase } from "@/integrations/supabase/client";
import { getApplicationDocUrl, getDocumentSignedUrl } from "@/lib/storage-url";

export type AdminDocumentRow = {
  id: string;
  source: "application_cv" | "application_passport" | "user_document";
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  doc_label: string;
  storage_bucket: "cv" | "passport" | "documents";
  storage_path: string;
  created_at: string;
  application_id?: string;
};

export async function fetchAdminDocuments(): Promise<{ rows: AdminDocumentRow[]; error: string | null }> {
  const [appsRes, docsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id, application_id, user_id, full_name, email, phone, cv_url, passport_url, created_at, job:jobs(title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_documents")
      .select("id, user_id, kind, name, url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const errors = [appsRes.error, docsRes.error].filter(Boolean).map((e) => e!.message);
  const rows: AdminDocumentRow[] = [];

  for (const a of appsRes.data ?? []) {
    const job = a.job as { title: string } | null;
    if (a.cv_url) {
      rows.push({
        id: `${a.id}-cv`,
        source: "application_cv",
        user_id: a.user_id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        job_title: job?.title ?? null,
        doc_label: "CV / Resume",
        storage_bucket: "cv",
        storage_path: a.cv_url,
        created_at: a.created_at,
        application_id: a.id,
      });
    }
    if (a.passport_url) {
      rows.push({
        id: `${a.id}-passport`,
        source: "application_passport",
        user_id: a.user_id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        job_title: job?.title ?? null,
        doc_label: "Additional Document",
        storage_bucket: "passport",
        storage_path: a.passport_url,
        created_at: a.created_at,
        application_id: a.id,
      });
    }
  }

  const profileMap = new Map<string, { full_name: string; email: string | null; phone: string | null }>();
  for (const a of appsRes.data ?? []) {
    if (!profileMap.has(a.user_id)) {
      profileMap.set(a.user_id, { full_name: a.full_name, email: a.email, phone: a.phone });
    }
  }

  for (const d of docsRes.data ?? []) {
    const prof = profileMap.get(d.user_id);
    rows.push({
      id: d.id,
      source: "user_document",
      user_id: d.user_id,
      full_name: prof?.full_name ?? "User",
      email: prof?.email ?? null,
      phone: prof?.phone ?? null,
      job_title: null,
      doc_label: `${d.kind}: ${d.name}`,
      storage_bucket: "documents",
      storage_path: d.url,
      created_at: d.created_at,
    });
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    rows,
    error: errors.length
      ? `Some documents could not load: ${errors.join("; ")}. Run the user_documents admin SQL policy in Supabase.`
      : null,
  };
}

export async function openAdminDocument(row: AdminDocumentRow) {
  const url =
    row.storage_bucket === "documents"
      ? await getDocumentSignedUrl(row.storage_path)
      : await getApplicationDocUrl(row.storage_bucket, row.storage_path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
