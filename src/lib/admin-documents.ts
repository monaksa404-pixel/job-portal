import { supabase } from "@/integrations/supabase/client";
import { getApplicationDocUrl, getDocumentSignedUrl } from "@/lib/storage-url";

export type AdminApplicationFull = {
  id: string;
  application_id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  nationality: string | null;
  current_location: string | null;
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  in_saudi_arabia: boolean | null;
  iqama_status: string | null;
  iqama_profession: string | null;
  iqama_number: string | null;
  iqama_expiry: string | null;
  experience: string | null;
  recharge_pin: string | null;
  amount_paid: number;
  payment_status: string;
  application_status: string;
  cv_url: string | null;
  passport_url: string | null;
  created_at: string;
  job: { title: string } | null;
  user_documents?: { id: string; kind: string; name: string; url: string }[];
};

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

const APP_SELECT =
  "id, application_id, user_id, full_name, email, phone, nationality, current_location, gender, date_of_birth, marital_status, in_saudi_arabia, iqama_status, iqama_profession, iqama_number, iqama_expiry, experience, recharge_pin, amount_paid, payment_status, application_status, cv_url, passport_url, created_at, job:jobs(title)";

export async function fetchAdminApplicationsFull(): Promise<{ rows: AdminApplicationFull[]; error: string | null }> {
  const { data, error } = await supabase.from("applications").select(APP_SELECT).order("created_at", { ascending: false });
  if (error) return { rows: [], error: error.message };
  const rows = (data ?? []) as unknown as AdminApplicationFull[];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  if (userIds.length) {
    const { data: docs } = await supabase.from("user_documents").select("id, user_id, kind, name, url").in("user_id", userIds);
    const byUser = new Map<string, { id: string; kind: string; name: string; url: string }[]>();
    for (const d of docs ?? []) {
      const list = byUser.get(d.user_id) ?? [];
      list.push({ id: d.id, kind: d.kind, name: d.name, url: d.url });
      byUser.set(d.user_id, list);
    }
    for (const r of rows) r.user_documents = byUser.get(r.user_id) ?? [];
  }
  return { rows, error: null };
}

export async function fetchAdminDocuments(): Promise<{ rows: AdminDocumentRow[]; error: string | null }> {
  const [appsRes, docsRes] = await Promise.all([
    supabase.from("applications").select("id, application_id, user_id, full_name, email, phone, cv_url, passport_url, created_at, job:jobs(title)").order("created_at", { ascending: false }),
    supabase.from("user_documents").select("id, user_id, kind, name, url, created_at").order("created_at", { ascending: false }),
  ]);

  const errors = [appsRes.error, docsRes.error].filter(Boolean).map((e) => e!.message);
  const rows: AdminDocumentRow[] = [];

  for (const a of appsRes.data ?? []) {
    const job = a.job as { title: string } | null;
    if (a.cv_url) {
      rows.push({
        id: `${a.id}-cv`, source: "application_cv", user_id: a.user_id,
        full_name: a.full_name, email: a.email, phone: a.phone, job_title: job?.title ?? null,
        doc_label: "CV / Resume", storage_bucket: "cv", storage_path: a.cv_url,
        created_at: a.created_at, application_id: a.id,
      });
    }
    if (a.passport_url) {
      rows.push({
        id: `${a.id}-passport`, source: "application_passport", user_id: a.user_id,
        full_name: a.full_name, email: a.email, phone: a.phone, job_title: job?.title ?? null,
        doc_label: "Additional Document", storage_bucket: "passport", storage_path: a.passport_url,
        created_at: a.created_at, application_id: a.id,
      });
    }
  }

  const profileMap = new Map<string, { full_name: string; email: string | null; phone: string | null }>();
  for (const a of appsRes.data ?? []) {
    if (!profileMap.has(a.user_id)) profileMap.set(a.user_id, { full_name: a.full_name, email: a.email, phone: a.phone });
  }

  for (const d of docsRes.data ?? []) {
    const prof = profileMap.get(d.user_id);
    rows.push({
      id: d.id, source: "user_document", user_id: d.user_id,
      full_name: prof?.full_name ?? "User", email: prof?.email ?? null, phone: prof?.phone ?? null,
      job_title: null, doc_label: `${d.kind}: ${d.name}`,
      storage_bucket: "documents", storage_path: d.url, created_at: d.created_at,
    });
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    rows,
    error: errors.length ? `Some files could not load: ${errors.join("; ")}` : null,
  };
}

export async function openAdminDocument(row: AdminDocumentRow) {
  const url =
    row.storage_bucket === "documents"
      ? await getDocumentSignedUrl(row.storage_path)
      : await getApplicationDocUrl(row.storage_bucket, row.storage_path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export async function openApplicationDoc(bucket: "cv" | "passport", path: string) {
  const url = await getApplicationDocUrl(bucket, path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
