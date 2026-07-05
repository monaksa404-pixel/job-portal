import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAllJobs, fetchCategories } from "@/lib/queries";
import { filterJobs } from "@/lib/filterJobs";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "./index";

type JobsSearch = {
  q?: string;
  category?: string;
  location?: string;
};

export const Route = createFileRoute("/jobs/")({
  validateSearch: (search: Record<string, unknown>): JobsSearch => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
    location: typeof search.location === "string" ? search.location : "",
  }),
  head: () => ({
    meta: [
      { title: "All Jobs — Job Expert" },
      { name: "description", content: "Browse all open positions across categories." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const navigate = useNavigate();
  const urlSearch = Route.useSearch();
  const q = useQuery({ queryKey: ["all-jobs"], queryFn: fetchAllJobs });
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [keyword, setKeyword] = useState(urlSearch.q ?? "");
  const [location, setLocation] = useState(urlSearch.location ?? "");

  useEffect(() => {
    setKeyword(urlSearch.q ?? "");
    setLocation(urlSearch.location ?? "");
  }, [urlSearch.q, urlSearch.location]);

  const jobs = filterJobs(q.data ?? [], urlSearch.q ?? "", urlSearch.category ?? "", urlSearch.location);
  const activeCategory = urlSearch.category
    ? (catsQ.data ?? []).find((c) => c.id === urlSearch.category)?.name
    : null;

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    navigate({
      to: "/jobs",
      search: {
        q: keyword.trim() || undefined,
        category: urlSearch.category || undefined,
        location: location.trim() || undefined,
      },
    });
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-navy-dark to-brand-navy p-6 lg:p-10 text-white">
        <h1 className="text-2xl lg:text-4xl font-extrabold">
          {activeCategory ? `${activeCategory} Jobs` : "All Jobs"}
        </h1>
        <p className="mt-2 text-white/70 text-sm">
          {activeCategory
            ? `${jobs.length} job(s) in this category.`
            : `Find your next opportunity from ${q.data?.length ?? 0} open positions.`}
        </p>
        {activeCategory && (
          <button
            type="button"
            onClick={() => navigate({ to: "/jobs", search: { q: urlSearch.q || undefined, location: urlSearch.location || undefined } })}
            className="mt-3 text-xs font-semibold text-brand-yellow hover:underline"
          >
            Clear category filter
          </button>
        )}
        <form onSubmit={runSearch} className="mt-5 bg-white rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-1 px-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search jobs, companies, locations..."
              className="flex-1 text-sm outline-none bg-transparent text-foreground py-2"
            />
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="text-sm outline-none bg-transparent text-foreground px-3 py-2 border-t sm:border-t-0 sm:border-l border-border"
          />
          <button type="submit" className="bg-brand-blue text-white font-semibold text-sm rounded-xl px-5 py-2.5 shrink-0">
            Search
          </button>
        </form>
      </section>

      <section className="mt-8">
        {jobs.length === 0 ? (
          <EmptyState
            title={urlSearch.q || urlSearch.location ? "No jobs match your search" : "No jobs available"}
            note={urlSearch.q || urlSearch.location ? "Try different keywords or clear filters." : "Publish jobs from your admin dashboard and they'll show up here."}
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
