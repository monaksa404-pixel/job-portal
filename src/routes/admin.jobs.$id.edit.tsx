import { createFileRoute } from "@tanstack/react-router";
import { JobEditor } from "@/components/admin/JobEditor";

export const Route = createFileRoute("/admin/jobs/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Job — Admin" }] }),
  component: EditJobPage,
});

function EditJobPage() {
  const { id } = Route.useParams();
  return <JobEditor jobId={id} />;
}
