import { supabase } from "@/integrations/supabase/client";

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function toggleSaveJob(userId: string, jobId: string): Promise<boolean> {
  const saved = await isJobSaved(userId, jobId);
  if (saved) {
    const { error } = await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
  if (error) throw error;
  return true;
}
