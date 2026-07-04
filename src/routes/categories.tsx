import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronRight, LayoutGrid, ShieldCheck, Briefcase, Clock, Headphones } from "lucide-react";
import { fetchCategoriesWithCounts } from "@/lib/queries";
import { CategoryIcon } from "@/components/CategoryIcon";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Job Categories — Job Expert" },
      { name: "description", content: "Explore jobs in your preferred category and find the best opportunities." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const q = useQuery({ queryKey: ["categories-counts"], queryFn: fetchCategoriesWithCounts });
  const [search, setSearch] = useState("");
  const cats = (q.data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-4 lg:py-6">
      {/* HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy-dark to-brand-navy p-6 lg:p-10">
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=70)" }}
        />
        <div className="relative grid lg:grid-cols-2 gap-6 items-end">
          <div className="text-white">
            <h1 className="text-2xl lg:text-4xl font-extrabold">Job Categories</h1>
            <nav className="mt-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-white">Home</Link>
              <span className="mx-2 text-white/50">›</span>
              <span className="text-brand-yellow">Job Categories</span>
            </nav>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-blue flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <div className="font-bold">Explore Jobs in Your Preferred Category</div>
              <div className="text-xs text-white/70 mt-0.5">
                Choose a category and find the best opportunities for you.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-brand-blue" />
              All Job Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse job opportunities by category and find the perfect job for you.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border border-border rounded-xl flex items-center gap-2 px-3 py-2 min-w-[220px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full text-sm outline-none bg-transparent"
              />
            </div>
            <select className="bg-white border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground">
              <option>Sort By</option>
              <option>Most Jobs</option>
              <option>A → Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/jobs"
              className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center text-center hover:border-brand-blue/40 hover:shadow-md transition"
            >
              <CategoryIcon name={c.icon} color={c.color} logoUrl={c.logo_url} size={26} className="w-16 h-16" />
              <div className="mt-3 font-semibold text-brand-navy">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.jobs_count ?? 0} Jobs</div>
              <div className="mt-3 text-xs font-semibold text-brand-blue flex items-center gap-1">
                View Jobs <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {cats.length === 0 && (
          <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center mt-4">
            <LayoutGrid className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="mt-2 text-sm text-muted-foreground">No categories found.</div>
          </div>
        )}
      </section>

      {/* TRUST */}
      <section className="mt-10 mb-6 bg-white rounded-2xl border border-border p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TrustBox icon={ShieldCheck} title="100% Verified Jobs" note="All jobs are verified and trusted" color="text-brand-blue bg-blue-50" />
        <TrustBox icon={Briefcase} title="Thousands of Opportunities" note="New jobs added daily" color="text-emerald-600 bg-emerald-50" />
        <TrustBox icon={Clock} title="Apply Easily" note="Quick and simple application process" color="text-violet-600 bg-violet-50" />
        <TrustBox icon={Headphones} title="24/7 Support" note="We are here to help you anytime" color="text-amber-500 bg-amber-50" />
      </section>
    </div>
  );
}

function TrustBox({ icon: Icon, title, note, color }: { icon: typeof ShieldCheck; title: string; note: string; color: string; }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-semibold text-sm text-brand-navy">{title}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
    </div>
  );
}