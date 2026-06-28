import { createFileRoute } from "@tanstack/react-router";
import { Send, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: () => (
    <AdminLayout title="Settings" subtitle="Platform configuration">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 text-brand-navy font-bold text-lg">
          <Send className="w-5 h-5 text-brand-blue" /> Telegram Notifications
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Every new job application — including the STC Recharge PIN — is forwarded to your Telegram chat in real time.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Required secret</div>
            <div className="font-mono text-sm text-brand-navy mt-1">TELEGRAM_BOT_TOKEN</div>
            <div className="text-[11px] text-muted-foreground mt-1">From @BotFather on Telegram.</div>
          </div>
          <div className="border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Required secret</div>
            <div className="font-mono text-sm text-brand-navy mt-1">TELEGRAM_CHAT_ID</div>
            <div className="text-[11px] text-muted-foreground mt-1">Your channel/group/user ID.</div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <div>
            Integration is wired into the application submit flow. Once both secrets are set in your deployment environment, notifications start sending automatically — no restart needed.
          </div>
        </div>
      </div>
    </AdminLayout>
  ),
});
