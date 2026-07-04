import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Bookmark, MapPin, Star, Briefcase, Clock, Users, CreditCard,
  Home, Utensils, Bus, ShieldPlus, Timer, ChevronRight, Share2, Facebook, Twitter, Link2,
  Info, Heart,
} from "lucide-react";
import { fetchJobById, formatRelative } from "@/lib/queries";
import { CompanyBrandRow, getJobCompanyInfo } from "@/components/CompanyBrand";
import { useAuth } from "@/hooks/use-auth";
import { isJobSaved, toggleSaveJob } from "@/lib/saved";

export const Route = createFileRoute("/jobs/$id/")({
  head: () => ({ meta: [{ title: "Job Details — Job Expert" }] }),
  component: JobDetailPage,
});

const FACILITIES = [
  { key: "accommodation" as const, icon: Home, label: "Free Accommodation", color: "text-emerald-600 bg-emerald-50" },
  { key: "food" as const, icon: Utensils, label: "Free Food", color: "text-orange-500 bg-orange-50" },
  { key: "transport" as const, icon: Bus, label: "Free Transport", color: "text-blue-600 bg-blue-50" },
  { key: "medical_insurance" as const, icon: ShieldPlus, label: "Medical Insurance", color: "text-rose-500 bg-rose-50" },
  { key: "overtime" as const, icon: Timer, label: "Overtime Available", color: "text-amber-500 bg-amber-50" },
];

function JobDetailPage() {
  const { id } = useParams({ from: "/jobs/$id/" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const q = useQuery({ queryKey: ["job", id], queryFn: () => fetchJobById(id) });
  const job = q.data;

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    isJobSaved(user.id, id).then(setSaved);
  }, [user, id]);

  async function onSaveToggle() {
    if (!user) {
      navigate({ to: "/auth", search: { next: `/jobs/${id}` } });
      return;
    }
    try {
      setSaved(await toggleSaveJob(user.id, id));
    } catch {
      /* ignore */
    }
  }

  if (q.isLoading) return <div className="p-10 text-center text-muted-foreground">Loading job…</div>;
  if (!job) return <div className="p-10 text-center text-muted-foreground">Job not found.</div>;

  const co = getJobCompanyInfo(job);
  const activeFacilities = FACILITIES.filter((f) => job[f.key]);

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-4 lg:py-6 pb-32">
      <nav className="text-xs lg:text-sm text-muted-foreground mb-4">
        <Link to="/">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/jobs">Jobs</Link>
        {job.category && (<>
          <span className="mx-2">›</span>
          <span>{job.category.name}</span>
        </>)}
        <span className="mx-2">›</span>
        <span className="text-brand-navy font-semibold">{job.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl font-extrabold text-brand-navy leading-tight">{job.title}</h1>
                <div className="mt-2.5">
                  <CompanyBrandRow
                    name={co.name}
                    logoUrl={co.logoUrl}
                    verified={co.verified}
                    website={co.website}
                    logoSize="sm"
                    nameClassName="text-sm lg:text-base font-bold text-brand-navy"
                    websiteClassName="text-xs text-muted-foreground"
                  />
                </div>
                <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {Number(job.rating).toFixed(1)} ({job.reviews_count.toLocaleString()} Reviews)
                  </span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tag tone="emerald">{job.job_type}</Tag>
                  <Tag tone="blue">{job.work_mode}</Tag>
                  <span className="text-xs text-muted-foreground">Posted {formatRelative(job.created_at)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-brand-blue font-extrabold text-lg lg:text-xl whitespace-nowrap">
                  {job.salary.toLocaleString()} <span className="text-sm">{job.salary_currency}</span>
                </div>
                <div className="text-xs text-muted-foreground">{job.salary_period}</div>
                <button type="button" onClick={onSaveToggle} aria-label="Save job" className="mt-2 inline-flex">
                  <Heart className={`w-5 h-5 ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Info1 icon={Briefcase} label="Experience" value={job.experience_required} />
              <Info1 icon={Clock} label="Duty Timing" value={job.duty_timing} />
              <Info1 icon={Users} label="Vacancies" value={`M: ${job.male_required} · F: ${job.female_required}`} compact />
              <Info1 icon={CreditCard} label="Application Fee" value={`${job.application_fee} SAR`} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
            <h2 className="font-bold text-brand-navy flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <Info className="w-4 h-4" />
              </span>
              Job Description
            </h2>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{job.description}</p>
            {job.responsibilities.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm list-disc pl-5 text-foreground/80">
                {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>

          {activeFacilities.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
              <h2 className="font-bold text-brand-navy flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">🎁</span>
                Facilities &amp; Benefits
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {activeFacilities.map((f) => (
                  <Facility key={f.key} icon={f.icon} label={f.label} color={f.color} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
            <h2 className="font-bold text-brand-navy mb-3">Job Details</h2>
            <dl className="divide-y divide-border text-sm">
              <Row label="Category" value={job.category?.name ?? "—"} />
              <Row label="Location" value={job.location} />
              <Row label="Experience Required" value={job.experience_required} />
              <Row label="Duty Timing" value={job.duty_timing} />
            </dl>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-4 lg:p-5">
            <h3 className="font-bold text-brand-navy mb-3 text-sm">Vacancies</h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-brand-navy min-w-0">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">♂</span>
                  <span className="truncate">Male Required</span>
                </span>
                <span className="font-bold shrink-0">{job.male_required}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-brand-navy min-w-0">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-[10px]">♀</span>
                  <span className="truncate">Female Required</span>
                </span>
                <span className="font-bold shrink-0">{job.female_required}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-brand-navy text-xs sm:text-sm">Total Vacancies</span>
                <span className="font-bold">{job.male_required + job.female_required}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </span>
              Application Fee
            </h3>
            <div className="mt-3 text-2xl font-extrabold text-brand-blue">{job.application_fee} SAR</div>
            <div className="text-xs text-muted-foreground">This fee is non-refundable</div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <Share2 className="w-4 h-4 text-brand-blue" /> Share this job
            </h3>
            <div className="mt-3 flex gap-2">
              <Social color="bg-emerald-500">W</Social>
              <Social color="bg-blue-600"><Facebook className="w-4 h-4 text-white" /></Social>
              <Social color="bg-sky-500"><Twitter className="w-4 h-4 text-white" /></Social>
              <Social color="bg-slate-200 text-slate-600"><Link2 className="w-4 h-4" /></Social>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
            <h3 className="font-bold text-brand-blue flex items-center gap-2 text-sm">
              <Info className="w-4 h-4" /> Important Information
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2"><Check /> Application fee is non-refundable.</li>
              <li className="flex gap-2"><Check /> Only shortlisted candidates will be contacted.</li>
              <li className="flex gap-2"><Check /> Make sure your information is correct before applying.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-16 lg:bottom-0 inset-x-0 z-30 bg-white border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="hidden lg:block">
            <div className="font-semibold text-brand-navy">Ready to apply for this job?</div>
            <div className="text-xs text-muted-foreground">Submit your application and get hired!</div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={onSaveToggle}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold flex items-center gap-2 text-brand-navy"
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
              {saved ? "Saved" : "Save Job"}
            </button>
            <Link
              to="/jobs/$id/apply"
              params={{ id: job.id }}
              className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90"
            >
              Apply Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "emerald" | "blue" }) {
  const c = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
  return <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c}`}>{children}</span>;
}
function Info1({ icon: Icon, label, value, compact }: { icon: typeof Briefcase; label: string; value: string; compact?: boolean }) {
  return (
    <div className="bg-secondary/60 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white flex items-center justify-center text-brand-blue shrink-0">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`font-semibold text-brand-navy ${compact ? "text-[11px] sm:text-xs leading-snug break-words" : "text-xs sm:text-sm truncate"}`}>{value}</div>
      </div>
    </div>
  );
}
function Facility({ icon: Icon, label, color }: { icon: typeof Home; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs font-medium text-brand-navy leading-tight">{label}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-brand-navy">{value}</dd>
    </div>
  );
}
function Social({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
      {children}
    </span>
  );
}
function Check() {
  return <span className="text-emerald-600 mt-0.5">✓</span>;
}
