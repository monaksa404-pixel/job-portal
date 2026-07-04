import { supabase } from "@/integrations/supabase/client";

export async function getApplicationDocUrl(bucket: "cv" | "passport", path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function getDocumentSignedUrl(path: string, expires = 3600) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, expires);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadAdminAttachment(userId: string, file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `admin/${userId}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
  if (error) throw error;
  return { path, name: file.name };
}
