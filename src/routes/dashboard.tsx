import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Users, XCircle, ChevronRight, Briefcase, Upload, FileCheck, Gift, BadgeCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentJobs } from "@/lib/queries";
import type { Application, Job } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Job Expert" }] }),
  component: () => <DashboardLayout><DashboardPage /></DashboardLayout>,
});

type AppRow = Application & { job?: { title: string; company_name: string; location: string; job_type: string } };

function DashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const name = (user?.user_metadata as { full_name?: string } | undefined)?.full_name || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("applications")
        .select("*, job:jobs(title, company_name, location, job_type)")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setApps((data ?? []) as AppRow[]);
    };
    load();
    fetchRecentJobs(3).then(setJobs);
    const ch = supabase.channel(`dash-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const total = apps.length;
  const inReview = apps.filter((a) => a.application_status === "under_review").length;
  const shortlisted = apps.filter((a) => a.application_status === "accepted").length;
  const rejected = apps.filter((a) => a.application_status === "rejected").length;

  const chartData = [
    { name: "In Review", value: inReview, color: "#2563eb" },
    { name: "Shortlisted", value: shortlisted, color: "#10b981" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
  ];

  return (
    <div className="space-y-5">
      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-extrabold text-brand-navy">{name} <span>👋</span></h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Total Applications" value={total} tint="bg-blue-50 text-brand-blue" />
        <StatCard icon={CheckCircle2} label="In Review" value={inReview} tint="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Users} label="Shortlisted" value={shortlisted} tint="bg-amber-50 text-amber-600" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} tint="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-brand-navy">Recent Applications</h3>
            <Link to="/my-applications" className="text-sm font-semibold text-brand-blue flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No applications yet. <Link to="/jobs" className="text-brand-blue font-semibold">Browse jobs</Link>.</p>
          ) : (
            <ul className="divide-y divide-border">
              {apps.slice(0, 5).map((a) => (
                <li key={a.id} className="py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold text-xs">
                    {(a.job?.company_name ?? "JE").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-brand-navy truncate">{a.job?.title}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">{a.job?.company_name} <BadgeCheck className="w-3 h-3 text-brand-blue" /></div>
                  </div>
                  <StatusPill status={a.application_status} />
                  <div className="hidden sm:block text-right">
                    <div className="text-[10px] text-muted-foreground">Applied on</div>
                    <div className="text-xs font-semibold text-brand-navy">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-bold text-brand-navy">Application Status</h3>
            <div className="relative h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={total > 0 ? chartData : [{ name: "Empty", value: 1, color: "#e5e7eb" }]}
                       dataKey="value" innerRadius={45} outerRadius={70} startAngle={90} endAngle={-270}>
                    {(total > 0 ? chartData : [{ color: "#e5e7eb" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-extrabold text-brand-navy">{total}</div>
                <div className="text-[11px] text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /> {d.name}</span>
                  <span className="text-muted-foreground">{d.value} ({total ? Math.round((d.value / total) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-bold text-brand-navy mb-2">Quick Actions</h3>
            <ul className="space-y-1">
              <QuickAction to="/jobs" icon={Briefcase} label="Browse Jobs" />
              <QuickAction to="/profile" icon={FileCheck} label="Update Profile" />
              <QuickAction to="/my-documents" icon={Upload} label="Upload Resume" />
              <QuickAction to="/my-documents" icon={FileText} label="My Documents" />
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-brand-navy">Recommended Jobs for You</h3>
            <Link to="/jobs" className="text-sm font-semibold text-brand-blue flex items-center gap-1">View <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {jobs.map((j) => (
              <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="bg-secondary/40 border border-border rounded-xl p-3 hover:border-brand-blue/40">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold text-xs">{j.company_name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-brand-navy truncate">{j.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{j.company_name}</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">📍 {j.location}</div>
                <div className="mt-1 text-[11px] font-semibold text-brand-blue">{j.salary.toLocaleString()} {j.salary_currency}</div>
                <div className="mt-2 w-full text-center py-1.5 rounded-md bg-brand-blue/10 text-brand-blue text-[11px] font-semibold">Apply Now</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-amber-50 border border-border rounded-2xl p-5 flex items-center gap-3">
          <Gift className="w-10 h-10 text-brand-blue shrink-0" />
          <div>
            <div className="font-extrabold text-brand-navy">Refer &amp; Earn</div>
            <p className="text-xs text-muted-foreground">Refer your friends and earn <b>25 SAR</b> for each successful application.</p>
            <button className="mt-2 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold">Refer Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof FileText; label: string; value: number; tint: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}><Icon className="w-5 h-5" /></div>
      <div className="mt-3 text-2xl font-extrabold text-brand-navy">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Briefcase; label: string }) {
  return (
    <li>
      <a href={to} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary text-sm">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center"><Icon className="w-4 h-4" /></span>
        <span className="flex-1 font-medium text-foreground/80">{label}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </a>
    </li>
  );
}

function StatusPill({ status }: { status: Application["application_status"] }) {
  const map = {
    under_review: { c: "bg-blue-50 text-brand-blue", t: "In Review" },
    accepted: { c: "bg-amber-50 text-amber-700", t: "Shortlisted" },
    rejected: { c: "bg-rose-50 text-rose-700", t: "Rejected" },
  } as const;
  const s = map[status];
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.c}`}>{s.t}</span>;
}