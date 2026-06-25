import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Job Expert" }] }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: next ?? "/" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <div className="bg-white border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-brand-navy">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Sign in to apply and track your applications." : "Get started in seconds."}
        </p>

        <div className="mt-5 space-y-3">
          {mode === "signup" && (
            <FieldRow icon={User} placeholder="Full name" value={full_name} onChange={setName} />
          )}
          <FieldRow icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />
          <FieldRow icon={Lock} placeholder="Password" value={password} onChange={setPassword} type="password" />
        </div>

        {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}

        <button
          onClick={go} disabled={busy || !email || !password}
          className="mt-5 w-full py-3 rounded-xl bg-brand-blue text-white font-semibold disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-brand-blue">
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ icon: Icon, placeholder, value, onChange, type = "text" }: { icon: typeof User; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm outline-none bg-transparent"
      />
    </div>
  );
}