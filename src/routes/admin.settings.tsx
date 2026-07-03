import { createFileRoute } from "@tanstack/react-router";
import { Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: () => (
    <AdminLayout title="Settings" subtitle="Platform configuration">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 text-brand-navy font-bold text-lg">
          <Send className="w-5 h-5 text-brand-blue" /> Telegram Payment Alerts
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          When a user submits an application with an STC PIN, your Telegram chat gets an instant alert with the PIN number. Approve or reject payments in Admin → Payment Transactions.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Env variable</div>
            <div className="font-mono text-sm text-brand-navy mt-1">TELEGRAM_BOT_TOKEN</div>
            <div className="text-[11px] text-muted-foreground mt-1">From @BotFather on Telegram</div>
          </div>
          <div className="border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Env variable</div>
            <div className="font-mono text-sm text-brand-navy mt-1">TELEGRAM_CHAT_ID</div>
            <div className="text-[11px] text-muted-foreground mt-1">Your group or personal chat ID</div>
          </div>
        </div>

        <div className="mt-4 border border-border rounded-xl p-4 text-sm space-y-3">
          <div className="font-semibold text-brand-navy">Setup steps</div>
          <ol className="list-decimal pl-5 space-y-2 text-foreground/80 text-xs">
            <li>Open Telegram → search <span className="font-mono">@BotFather</span> → send <span className="font-mono">/newbot</span> → copy the bot token.</li>
            <li>Create a group (e.g. Job Expert Payments) → add your bot as admin.</li>
            <li>Send any message in the group → open <span className="font-mono">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span> in browser → find <span className="font-mono">"chat":{"id":...}</span>.</li>
            <li>Add <span className="font-mono">TELEGRAM_BOT_TOKEN</span> and <span className="font-mono">TELEGRAM_CHAT_ID</span> in Vercel → Settings → Environment Variables.</li>
            <li>Redeploy. Test by submitting a job application with a PIN.</li>
          </ol>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Recommended:</span> use Telegram for alerts only. Verify PIN manually, then approve or reject in <span className="font-semibold">Admin → Payment Transactions</span> or <span className="font-semibold">Applications</span>. Telegram approve/reject buttons need a webhook bot and are not enabled yet.
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <div>
            Optional: set <span className="font-mono">SITE_URL</span> (e.g. https://omega-59.vercel.app) so Telegram messages include a direct link to the admin payments page.
          </div>
        </div>
      </div>
    </AdminLayout>
  ),
});
