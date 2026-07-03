import { createFileRoute } from "@tanstack/react-router";
import { JobEditor } from "@/components/admin/JobEditor";

export const Route = createFileRoute("/admin/jobs/new")({
  head: () => ({ meta: [{ title: "Add New Job — Admin" }] }),
  component: () => <JobEditor />,
});
