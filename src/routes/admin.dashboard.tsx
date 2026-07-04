import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_DASHBOARD_APP_SELECT } from "@/lib/admin-applications";
import { Briefcase, FileText, Users as UsersIcon, Eye, Plus, Send, Pencil, MoreHorizontal, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: AdminDashboard,
});

type Stat = { jobs: number; apps: number; users: number; views: number };
type RecentApp = { id: string; created_at: string; application_status: string; full_name: string; job?: { title: string; company_name: string; company?: { name: string } | null } | null };
type RecentJob = { id: string; title: string; status: string; created_at: string; category?: { name: string } | null; company?: { name: string } | null; _count?: number };

function AdminDashboard() {
  const [stat, setStat] = useState<Stat>({ jobs: 0, apps: 0, users: 0, views: 0 });
  const [trend, setTrend] = useState<{ d: string; v: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topCats, setTopCats] = useState<{ name: string; v: number }[]>([]);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: jobs }, { count: apps }, { count: users }] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setStat({ jobs: jobs ?? 0, apps: apps ?? 0, users: users ?? 0, views: (jobs ?? 0) * 160 });

      // 7-day apps trend
      const days: { d: string; v: number }[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const start = new Date(d); start.setHours(0,0,0,0);
        const end = new Date(d); end.setHours(23,59,59,999);
        const { count } = await supabase.from("applications").select("id", { count: "exact", head: true })
          .gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
        days.push({ d: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), v: count ?? 0 });
      }
      setTrend(days);

      // jobs by status
      const { data: js } = await supabase.from("jobs").select("status");
      const map: Record<string, number> = {};
      (js ?? []).forEach((r: { status: string }) => { map[r.status] = (map[r.status] ?? 0) + 1; });
      setByStatus([
        { name: "Active",  value: map["active"]  ?? 0, color: "#10b981" },
        { name: "Draft",   value: map["draft"]   ?? 0, color: "#3b82f6" },
        { name: "Closed",  value: map["closed"]  ?? 0, color: "#ef4444" },
      ]);

      // top categories by jobs count
      const { data: jc } = await supabase.from("jobs").select("category:categories(name)").eq("status", "active") as unknown as { data: { category: { name: string } | null }[] };
      const cmap: Record<string, number> = {};
      (jc ?? []).forEach((r) => {
        if (!r.category) return; cmap[r.category.name] = (cmap[r.category.name] ?? 0) + 1;
      });
      setTopCats(Object.entries(cmap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, v]) => ({ name, v })));

      // recent apps
      const { data: ra } = await supabase.from("applications")
        .select(ADMIN_DASHBOARD_APP_SELECT)
        .order("created_at", { ascending: false }).limit(5);
      setRecentApps((ra ?? []) as unknown as RecentApp[]);

      // recent jobs
      const { data: rj } = await supabase.from("jobs")
        .select("id, title, status, created_at, category:categories(name), company:companies(name)")
        .order("created_at", { ascending: false }).limit(5);
      setRecentJobs((rj ?? []) as unknown as RecentJob[]);
    };
    load();
    const ch = supabase.channel("admin-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <AdminLayout title="Welcome back," subtitle="Admin User" actions={
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-brand-navy">
        <Calendar className="w-4 h-4" /> Last 7 Days
      </div>
    }>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={stat.jobs} tint="bg-brand-blue/10 text-brand-blue" />
        <StatCard icon={FileText} label="Total Applications" value={stat.apps} tint="bg-emerald-100 text-emerald-600" />
        <StatCard icon={UsersIcon} label="Total Users" value={stat.users} tint="bg-amber-100 text-amber-600" />
        <StatCard icon={Eye} label="Profile Views" value={stat.views} tint="bg-violet-100 text-violet-600" />
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-brand-navy">Applications Overview</div>
            <div className="text-xs px-3 py-1.5 rounded-lg bg-secondary">Last 7 Days</div>
          </div>
          <div className="h-72 mt-3">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="url(#ga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-brand-navy">Recent Applications</div>
            <Link to="/admin/applications" className="text-xs font-semibold text-brand-blue">View All</Link>
          </div>
          <div className="mt-3 divide-y divide-border">
            {recentApps.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No applications yet</div>}
            {recentApps.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold flex items-center justify-center">
                  {r.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-brand-navy truncate">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.job?.title} {(r.job?.company?.name ?? r.job?.company_name) ? `at ${r.job?.company?.name ?? r.job?.company_name}` : ""}</div>
                </div>
                <StatusBadge s={r.application_status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-bold text-brand-navy">Jobs by Status</div>
          <div className="h-48 mt-2 relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                  {byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-extrabold text-brand-navy">{stat.jobs}</div>
              <div className="text-[11px] text-muted-foreground">Total</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {byStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-semibold text-brand-navy">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-bold text-brand-navy">Top Job Categories</div>
          <div className="mt-4 space-y-3">
            {topCats.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No data yet</div>}
            {topCats.map((c) => {
              const max = Math.max(...topCats.map(x => x.v), 1);
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-semibold text-brand-navy">{c.v}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-brand-blue" style={{ width: `${(c.v / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="font-bold text-brand-navy">Quick Actions</div>
          <div className="mt-3 space-y-2">
            <QA to="/admin/jobs/new" icon={Plus} label="Post New Job" primary />
            <QA to="/admin/jobs" icon={Briefcase} label="Manage Jobs" />
            <QA to="/admin/applications" icon={FileText} label="View Applications" />
            <QA to="/admin/notifications" icon={Send} label="Send Notification" />
          </div>
        </div>
      </div>

      {/* Recent Job Posts */}
      <div className="bg-white rounded-2xl border border-border mt-4 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <div className="font-bold text-brand-navy">Recent Job Posts</div>
          <Link to="/admin/jobs" className="text-xs font-semibold text-brand-blue">View All Jobs ›</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr><th className="text-left px-5 py-3 font-medium">Job Title</th><th className="text-left px-3 py-3 font-medium">Category</th><th className="text-left px-3 py-3 font-medium">Posted On</th><th className="text-left px-3 py-3 font-medium">Status</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No jobs yet</td></tr>}
              {recentJobs.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy">{j.title}</div>
                    <div className="text-xs text-muted-foreground">{j.company?.name ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{j.category?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3"><JobStatusBadge s={j.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <a href={`/jobs/${j.id}`} className="p-1.5 rounded hover:bg-secondary"><Eye className="w-4 h-4 text-muted-foreground" /></a>
                      <Link to="/admin/jobs" className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></Link>
                      <button className="p-1.5 rounded hover:bg-secondary"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Briefcase; label: string; value: number; tint: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}><Icon className="w-5 h-5" /></div>
        <div>
          <div className="text-2xl font-extrabold text-brand-navy leading-none">{value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> vs last 30 days</div>
    </div>
  );
}

function QA({ to, icon: Icon, label, primary }: { to: string; icon: typeof Plus; label: string; primary?: boolean }) {
  return (
    <Link to={to} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold ${primary ? "bg-brand-navy text-white" : "border border-border text-brand-navy hover:bg-secondary"}`}>
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    under_review: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    shortlisted: "bg-violet-100 text-violet-700",
    new: "bg-sky-100 text-sky-700",
  };
  const label = s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[s] ?? "bg-secondary text-foreground"}`}>{label}</span>;
}

function JobStatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = { active: "bg-emerald-100 text-emerald-700", draft: "bg-sky-100 text-sky-700", closed: "bg-rose-100 text-rose-700" };
  return <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${m[s] ?? "bg-secondary"}`}>{s.replace(/^./, (c) => c.toUpperCase())}</span>;
}
