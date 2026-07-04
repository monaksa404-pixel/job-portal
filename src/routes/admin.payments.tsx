import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PAYMENT_SELECT } from "@/lib/admin-applications";
import { AdminToast, AdminSpinner } from "@/components/admin/AdminToast";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payment Transactions — Admin" }] }),
  component: Payments,
});

type Row = {
  id: string;
  application_id: string;
  recharge_pin: string | null;
  payment_status: string;
  created_at: string;
  user_id: string;
  full_name: string;
  phone: string;
  amount_paid: number;
  job: { title: string; application_fee: number | null } | null;
};

function Payments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(ADMIN_PAYMENT_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load payments:", error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as unknown as Row[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-pay").on("postgres_changes", { event: "*", schema: "public", table: "applications" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const verify = async (id: string, ok: boolean, userId: string) => {
    const action = ok ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this STC recharge PIN?`)) return;
    const key = `${id}-${ok ? "ok" : "no"}`;
    setBusyKey(key);
    const { error } = await supabase
      .from("applications")
      .update({ payment_status: ok ? "verified" : "rejected" })
      .eq("id", id);
    if (error) {
      showToast("Failed to update payment.", "error");
      setBusyKey(null);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: userId,
      title: `Payment ${ok ? "Verified" : "Rejected"}`,
      message: ok ? "Your STC recharge pin has been verified." : "Your STC recharge pin was rejected.",
      type: "application_update",
    });
    showToast(ok ? "Recharge PIN approved." : "Recharge PIN rejected.");
    await load();
    setBusyKey(null);
  };

  return (
    <AdminLayout title="Payment Transactions" subtitle="Verify STC recharge pins">
      {toast && <AdminToast text={toast.text} type={toast.type} />}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">App ID</th>
                <th className="text-left px-3 py-3">Applicant</th>
                <th className="text-left px-3 py-3">Job</th>
                <th className="text-left px-3 py-3">Fee</th>
                <th className="text-left px-3 py-3">Recharge PIN</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No transactions yet</td></tr>
              )}
              {rows.map((r) => {
                const pending = r.payment_status === "pending";
                const fee = r.job?.application_fee ?? r.amount_paid;
                const busy = busyKey?.startsWith(r.id) ?? false;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-5 py-3 font-mono text-xs">{r.application_id}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-brand-navy">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{r.job?.title ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{fee ? `${fee} SAR` : "Free"}</td>
                    <td className="px-3 py-3 font-mono text-xs break-all max-w-[140px]">{r.recharge_pin ?? "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        r.payment_status === "verified" ? "bg-emerald-100 text-emerald-700"
                          : r.payment_status === "rejected" ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {r.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {pending ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => verify(r.id, true, r.user_id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-60 active:scale-95 transition"
                          >
                            {busyKey === `${r.id}-ok` ? <AdminSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            Approve PIN
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => verify(r.id, false, r.user_id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 active:scale-95 transition"
                          >
                            {busyKey === `${r.id}-no` ? <AdminSpinner className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            Reject PIN
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
