import { supabase } from "@/integrations/supabase/client";

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const { data } = await supabase.from("saved_jobs").select("id").eq("user_id", userId).eq("job_id", jobId).maybeSingle();
  return !!data;
}
export async function toggleSaveJob(userId: string, jobId: string): Promise<boolean> {
  const saved = await isJobSaved(userId, jobId);
  if (saved) {
    await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
    return false;
  }
  await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
  return true;
}