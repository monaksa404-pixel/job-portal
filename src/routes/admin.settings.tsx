import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: () => (
    <AdminLayout title="Settings" subtitle="Platform configuration">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="font-bold text-brand-navy">Telegram Bot</div>
        <p className="text-sm text-muted-foreground mt-1">When a user submits an application, the STC Recharge PIN is forwarded to Telegram. Configure these in your deployment environment:</p>
        <ul className="mt-3 text-sm space-y-1">
          <li><span className="font-mono bg-secondary px-2 py-0.5 rounded">TELEGRAM_BOT_TOKEN</span></li>
          <li><span className="font-mono bg-secondary px-2 py-0.5 rounded">TELEGRAM_CHAT_ID</span></li>
        </ul>
      </div>
    </AdminLayout>
  ),
});
