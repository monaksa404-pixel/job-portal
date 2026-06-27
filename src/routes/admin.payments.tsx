import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payment Transactions — Admin" }] }),
  component: Payments,
});

type Row = { id: string; application_id: string; recharge_pin: string | null; payment_status: string; created_at: string; user_id: string; job: { title: string; application_fee: number | null } | null; profile: { full_name: string | null; phone: string | null } | null };

function Payments() {
  const [rows, setRows] = useState<Row[]>([]);
  const load = async () => {
    const { data } = await supabase.from("applications").select("id, application_id, recharge_pin, payment_status, created_at, user_id, job:jobs(title, application_fee), profile:profiles!applications_user_id_fkey(full_name, phone)").order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-pay").on("postgres_changes", { event: "*", schema: "public", table: "applications" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const verify = async (id: string, ok: boolean, userId: string) => {
    await supabase.from("applications").update({ payment_status: ok ? "verified" : "rejected" }).eq("id", id);
    await supabase.from("notifications").insert({ user_id: userId, title: `Payment ${ok ? "Verified" : "Rejected"}`, message: ok ? "Your STC recharge pin has been verified." : "Your STC recharge pin was rejected.", type: ok ? "accepted" : "rejected" });
  };

  return (
    <AdminLayout title="Payment Transactions" subtitle="Verify STC recharge pins">
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr><th className="text-left px-5 py-3">App ID</th><th className="text-left px-3 py-3">Applicant</th><th className="text-left px-3 py-3">Job</th><th className="text-left px-3 py-3">Fee</th><th className="text-left px-3 py-3">Recharge PIN</th><th className="text-left px-3 py-3">Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No transactions</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-3 font-mono text-xs">{r.application_id}</td>
                  <td className="px-3 py-3"><div className="font-semibold text-brand-navy">{r.profile?.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{r.profile?.phone ?? ""}</div></td>
                  <td className="px-3 py-3 text-muted-foreground">{r.job?.title ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.job?.application_fee ? `${r.job.application_fee} SAR` : "Free"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{r.recharge_pin ?? "—"}</td>
                  <td className="px-3 py-3"><span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${r.payment_status === "verified" ? "bg-emerald-100 text-emerald-700" : r.payment_status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.payment_status}</span></td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => verify(r.id, true, r.user_id)} className="p-1.5 rounded hover:bg-emerald-50"><Check className="w-4 h-4 text-emerald-600" /></button>
                      <button onClick={() => verify(r.id, false, r.user_id)} className="p-1.5 rounded hover:bg-rose-50"><X className="w-4 h-4 text-rose-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
