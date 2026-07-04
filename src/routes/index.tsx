import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search, MapPin, LayoutGrid, Briefcase, Users, Building2,
  ChevronRight, ShieldCheck, HeartHandshake, Lock, Headphones, Crosshair,
} from "lucide-react";
import { fetchCategoriesWithCounts, fetchRecentJobs } from "@/lib/queries";
import { CategoryIcon } from "@/components/CategoryIcon";
import { JobCard } from "@/components/JobCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job Expert — Find Your Dream Career" },
      { name: "description", content: "Explore thousands of verified job opportunities across Saudi Arabia." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const categoriesQ = useQuery({ queryKey: ["categories-counts"], queryFn: fetchCategoriesWithCounts });
  const jobsQ = useQuery({ queryKey: ["recent-jobs", 6], queryFn: () => fetchRecentJobs(6) });

  const categories = categoriesQ.data ?? [];
  const jobs = jobsQ.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/jobs",
      search: {
        q: keyword.trim() || undefined,
        category: categoryId || undefined,
        location: location.trim() || undefined,
      },
    });
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-4 lg:py-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy-dark via-brand-navy to-brand-navy">
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=70)",
          }}
        />
        <div className="relative grid lg:grid-cols-2 gap-6 p-6 lg:p-12">
          <div className="text-white">
            <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">
              Find Your
              <br />
              <span className="text-brand-yellow">Dream Career</span>
            </h1>
            <p className="mt-3 text-sm lg:text-base text-white/80 max-w-md">
              Explore thousands of verified job opportunities and take the next step in your career.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 lg:gap-3 max-w-md">
              <Stat icon={Briefcase} value="10,000+" label="Active Jobs" tint="bg-blue-500/20 text-blue-300" />
              <Stat icon={Users} value="5,000+" label="Happy Users" tint="bg-emerald-500/20 text-emerald-300" />
              <Stat icon={Building2} value="500+" label="Top Companies" tint="bg-violet-500/20 text-violet-300" />
            </div>
          </div>
          <div className="hidden lg:block" />
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative px-4 lg:px-12 pb-6 lg:pb-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 lg:p-3 flex flex-col lg:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 border-b lg:border-b-0 lg:border-r border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                className="w-full text-sm outline-none bg-transparent"
                placeholder="Job Title, Keyword or Company"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 py-2 border-b lg:border-b-0 lg:border-r border-border">
              <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                className="w-full text-sm outline-none bg-transparent text-muted-foreground"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 py-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                className="w-full text-sm outline-none bg-transparent"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Crosshair className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
            <button type="submit" className="bg-brand-blue text-white font-semibold text-sm rounded-xl px-6 py-3 flex items-center justify-center gap-2 hover:opacity-90">
              <Search className="w-4 h-4" /> Search Jobs
            </button>
          </div>
        </form>
      </section>

      {/* CATEGORIES */}
      <section className="mt-10 lg:mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg lg:text-xl font-bold text-brand-navy flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-brand-blue" />
            Browse Job Categories
          </h2>
          <Link to="/categories" className="text-sm font-semibold text-brand-blue flex items-center gap-1">
            View All Categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              to="/jobs"
              className="bg-white border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:border-brand-blue/40 hover:shadow-md transition"
            >
              <CategoryIcon name={c.icon} color={c.color} size={26} className="w-14 h-14" />
              <div className="mt-3 font-semibold text-sm text-brand-navy">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.jobs_count ?? 0} Jobs</div>
            </Link>
          ))}
          <Link
            to="/categories"
            className="bg-white border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:border-brand-blue/40 hover:shadow-md transition"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-slate-400" />
            </div>
            <div className="mt-3 font-semibold text-sm text-brand-navy">Other</div>
            <div className="text-[11px] text-muted-foreground">View all</div>
          </Link>
        </div>
      </section>

      {/* RECENT JOBS */}
      <section className="mt-10 lg:mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg lg:text-xl font-bold text-brand-navy flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-brand-blue" />
            Recent Jobs
          </h2>
          <Link to="/jobs" className="text-sm font-semibold text-brand-blue flex items-center gap-1">
            View All Jobs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            note="Once your admin publishes jobs from the dashboard, they will appear here."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        )}
      </section>

      {/* TRUST */}
      <section className="mt-10 lg:mt-14 mb-6 bg-white rounded-2xl border border-border p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Trust icon={ShieldCheck} title="100% Verified Jobs" note="All jobs are verified and trusted" color="text-brand-blue bg-blue-50" />
        <Trust icon={HeartHandshake} title="Trusted by Thousands" note="Join thousands of happy users" color="text-violet-600 bg-violet-50" />
        <Trust icon={Lock} title="Secure & Safe" note="Your data is always protected" color="text-emerald-600 bg-emerald-50" />
        <Trust icon={Headphones} title="24/7 Support" note="We are here to help you" color="text-amber-500 bg-amber-50" />
      </section>
    </div>
  );
}

function Stat({ icon: Icon, value, label, tint }: { icon: typeof Briefcase; value: string; label: string; tint: string; }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 flex items-center gap-2">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="leading-tight">
        <div className="font-bold text-sm">{value}</div>
        <div className="text-[10px] text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title, note, color }: { icon: typeof ShieldCheck; title: string; note: string; color: string; }) {
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

export function EmptyState({ title, note }: { title: string; note: string }) {
  return (
    <div className="bg-white border border-dashed border-border rounded-2xl py-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
        <Briefcase className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="mt-3 font-semibold text-brand-navy">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{note}</div>
    </div>
  );
}
