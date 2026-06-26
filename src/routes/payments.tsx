import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — Job Expert" }] }),
  component: () => <DashboardLayout><PaymentsPage /></DashboardLayout>,
});

type Row = {
  id: string; application_id: string; amount_paid: number; recharge_pin: string;
  payment_status: "pending" | "verified" | "rejected"; created_at: string;
  job?: { title: string; company_name: string };
};

function PaymentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("applications")
        .select("id, application_id, amount_paid, recharge_pin, payment_status, created_at, job:jobs(title, company_name)")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    };
    load();
    const ch = supabase.channel(`pay-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-blue" /> Payments</h1>
      <p className="text-sm text-muted-foreground">STC Recharge PIN payments are manually verified by our team.</p>

      <div className="mt-5 bg-white border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3">Application</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">PIN</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No payments yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-semibold text-brand-navy">{r.job?.title ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.application_id}</div>
                </td>
                <td className="px-4 py-3 font-semibold">{r.amount_paid} SAR</td>
                <td className="px-4 py-3 font-mono text-xs">{r.recharge_pin}</td>
                <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><PayBadge s={r.payment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayBadge({ s }: { s: "pending" | "verified" | "rejected" }) {
  const m = {
    pending: "bg-amber-50 text-amber-700",
    verified: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
  } as const;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${m[s]}`}>{s}</span>;
}