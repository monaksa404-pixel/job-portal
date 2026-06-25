import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { fetchAllJobs } from "@/lib/queries";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "./index";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "All Jobs — Job Expert" },
      { name: "description", content: "Browse all open positions across categories." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const q = useQuery({ queryKey: ["all-jobs"], queryFn: fetchAllJobs });
  const [search, setSearch] = useState("");
  const jobs = (q.data ?? []).filter((j) =>
    [j.title, j.company_name, j.location].join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-navy-dark to-brand-navy p-6 lg:p-10 text-white">
        <h1 className="text-2xl lg:text-4xl font-extrabold">All Jobs</h1>
        <p className="mt-2 text-white/70 text-sm">
          Find your next opportunity from {q.data?.length ?? 0} open positions.
        </p>
        <div className="mt-5 bg-white rounded-2xl p-2 flex items-center gap-2 max-w-2xl">
          <Search className="w-4 h-4 text-muted-foreground ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies, locations..."
            className="flex-1 text-sm outline-none bg-transparent text-foreground"
          />
          <button className="bg-brand-blue text-white font-semibold text-sm rounded-xl px-5 py-2.5">
            Search
          </button>
        </div>
      </section>

      <section className="mt-8">
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs available"
            note="Publish jobs from your admin dashboard and they'll show up here."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        )}
      </section>
    </div>
  );
}