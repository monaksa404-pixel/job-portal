import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, BarChart3, Users as UsersIcon, Mail, Lock, Eye, EyeOff, Briefcase } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Job Expert" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
        if (isAdmin) nav({ to: "/admin/dashboard" });
      }
    })();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setErr(error?.message ?? "Sign in failed"); setBusy(false); return; }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setBusy(false);
    if (!isAdmin) { setErr("This account is not an admin."); await supabase.auth.signOut(); return; }
    nav({ to: "/admin/dashboard" });
  }

  return (
    <div className="min-h-screen bg-brand-navy text-white grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10">
          <Logo />
          <h1 className="mt-16 text-5xl font-extrabold leading-tight">
            Admin<br /><span className="text-brand-yellow">Dashboard</span>
          </h1>
          <p className="mt-4 text-white/70 max-w-md">Sign in to access and manage the Job Expert platform.</p>
          <ul className="mt-10 space-y-5">
            <Feature icon={Shield} title="Secure Access" body="Your admin account is protected with advanced security." />
            <Feature icon={BarChart3} title="Manage Everything" body="Manage jobs, applications, users and system settings." />
            <Feature icon={UsersIcon} title="Real-time Updates" body="Get real-time insights and important alerts." />
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} Job Expert. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-brand-navy">
        <form onSubmit={submit} className="bg-white text-brand-navy rounded-3xl p-8 lg:p-10 w-full max-w-md shadow-2xl">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-navy text-brand-yellow flex items-center justify-center"><Briefcase className="w-7 h-7" /></div>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-center">Welcome Back!</h2>
          <p className="text-sm text-muted-foreground text-center">Please sign in to your admin account</p>

          {err && <div className="mt-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2 text-sm">{err}</div>}

          <label className="block mt-6 text-xs font-bold">Email Address</label>
          <div className="mt-1.5 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm" />
          </div>

          <label className="block mt-4 text-xs font-bold">Password</label>
          <div className="mt-1.5 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border text-sm" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5"><input type="checkbox" className="rounded" /> Remember me</label>
            <a className="text-brand-blue font-semibold" href="#">Forgot Password?</a>
          </div>

          <button type="submit" disabled={busy}
            className="mt-5 w-full bg-brand-navy text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            <Lock className="w-4 h-4" /> {busy ? "Signing in…" : "Login to Dashboard"}
          </button>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="text-brand-blue font-semibold">← Back to site</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Shield; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-brand-yellow" /></div>
      <div>
        <div className="font-bold text-brand-yellow">{title}</div>
        <div className="text-sm text-white/70">{body}</div>
      </div>
    </li>
  );
}
