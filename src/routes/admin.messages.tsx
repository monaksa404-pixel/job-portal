import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Email Templates — Admin" }] }),
  component: () => (
    <AdminLayout title="Email Templates" subtitle="Predefined messages">
      <div className="bg-white rounded-2xl border border-border p-6 text-sm text-muted-foreground">
        <div className="font-bold text-brand-navy mb-2 text-base">Quick replies</div>
        Use the Send Notifications page to deliver any of these to selected users.
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>Your application has been accepted.</li>
          <li>Please upload additional documents.</li>
          <li>Contact us on WhatsApp.</li>
          <li>Your visa process has started.</li>
          <li>Please visit our office.</li>
        </ul>
      </div>
    </AdminLayout>
  ),
});
