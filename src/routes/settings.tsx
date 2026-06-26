import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Job Expert" }] }),
  component: () => <DashboardLayout><SettingsPage /></DashboardLayout>,
});

function SettingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function changePassword() {
    if (pw.length < 6) { setMsg("Password must be at least 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? error.message : "Password updated.");
    if (!error) setPw("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-brand-blue" /> Settings</h1>
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-bold text-brand-navy">Account</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Signed in as {user?.email}</p>
      </div>
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-bold text-brand-navy">Change Password</h2>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password"
                 className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
          <button onClick={changePassword} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">Update</button>
        </div>
        {msg && <div className="mt-2 text-xs text-muted-foreground">{msg}</div>}
      </div>
      <div className="bg-white border border-border rounded-2xl p-5">
        <button onClick={signOut} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-rose-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign out</button>
      </div>
    </div>
  );
}