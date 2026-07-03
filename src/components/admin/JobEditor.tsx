import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AmountInput } from "@/components/AmountInput";
import { supabase } from "@/integrations/supabase/client";
import { Check, MapPin, Building2, Upload, Trash2, Plus, BadgeCheck } from "lucide-react";
import { parseSalaryAmount, resolveJobSalary } from "@/lib/utils";

type Category = { id: string; name: string };
type Company = { id: string; name: string; logo_url: string | null; website: string | null; verified: boolean };
type Form = {
  title: string; category_id: string; job_type: string; employment_type: string;
  location: string; salary_min: string; salary_max: string; salary_disclosed: boolean;
  description: string;
  posted_by: "admin" | "company"; company_id: string;
  new_co_name: string; new_co_logo: string; new_co_website: string;
  added_companies: { id: string; name: string; logo_url: string | null; website: string | null }[];
  male_required: number; female_required: number; experience_required: string;
  duty_timing: string;
  accommodation: boolean; food: boolean; transport: boolean; medical_insurance: boolean; overtime: boolean;
  fee_enabled: boolean; application_fee: number;
};

const empty: Form = {
  title: "", category_id: "", job_type: "Full-time", employment_type: "Permanent",
  location: "", salary_min: "", salary_max: "", salary_disclosed: true, description: "",
  posted_by: "admin", company_id: "", new_co_name: "", new_co_logo: "", new_co_website: "",
  added_companies: [], male_required: 0, female_required: 0, experience_required: "",
  duty_timing: "8 hours", accommodation: false, food: false, transport: false, medical_insurance: false, overtime: false,
  fee_enabled: true, application_fee: 50,
};

type DbJob = Form & {
  id: string;
  salary: number;
  application_fee: number;
  company_id: string | null;
  posted_by: string;
  added_companies: Form["added_companies"];
  status: string;
};

export function JobEditor({ jobId }: { jobId?: string }) {
  const nav = useNavigate();
  const isEdit = !!jobId;
  const [step, setStep] = useState(1);
  const [cats, setCats] = useState<Category[]>([]);
  const [cos, setCos] = useState<Company[]>([]);
  const [f, setF] = useState<Form>(empty);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("sort_order").then(({ data }) => setCats((data ?? []) as Category[]));
    supabase.from("companies").select("id, name, logo_url, website, verified").order("sort_order").then(({ data }) => setCos((data ?? []) as Company[]));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setErr("Job not found.");
          setLoading(false);
          return;
        }
        const j = data as unknown as DbJob;
        setF({
          title: j.title ?? "",
          category_id: j.category_id ?? "",
          job_type: j.job_type ?? "Full-time",
          employment_type: j.employment_type ?? "Permanent",
          location: j.location ?? "",
          salary_min: j.salary ? String(j.salary) : "",
          salary_max: "",
          salary_disclosed: true,
          description: j.description ?? "",
          posted_by: j.posted_by === "company" ? "company" : "admin",
          company_id: j.company_id ?? "",
          new_co_name: "",
          new_co_logo: "",
          new_co_website: "",
          added_companies: Array.isArray(j.added_companies) ? j.added_companies : [],
          male_required: j.male_required ?? 0,
          female_required: j.female_required ?? 0,
          experience_required: j.experience_required ?? "",
          duty_timing: j.duty_timing ?? "8 hours",
          accommodation: !!j.accommodation,
          food: !!j.food,
          transport: !!j.transport,
          medical_insurance: !!j.medical_insurance,
          overtime: !!j.overtime,
          fee_enabled: (j.application_fee ?? 0) > 0,
          application_fee: j.application_fee ?? 50,
        });
        setLoading(false);
      });
  }, [jobId]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setErr(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setErr("Please sign in again.");
      setUploading(false);
      return;
    }
    const path = `${uid}/companies/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setErr(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setF((p) => ({ ...p, new_co_logo: data.publicUrl }));
    setUploading(false);
  };

  const addNewCompany = async () => {
    if (!f.new_co_name.trim()) return;
    const { data, error } = await supabase.from("companies").insert({ name: f.new_co_name, logo_url: f.new_co_logo || null, website: f.new_co_website || null }).select().single();
    if (error) { setErr(error.message); return; }
    const co = data as Company;
    setCos((p) => [...p, co]);
    setF((p) => ({ ...p, added_companies: [...p.added_companies, { id: co.id, name: co.name, logo_url: co.logo_url, website: co.website }], company_id: p.company_id || co.id, new_co_name: "", new_co_logo: "", new_co_website: "" }));
  };

  const buildPayload = () => {
    const selectedCompany = cos.find((c) => c.id === f.company_id);
    const companyName =
      f.posted_by === "company"
        ? (selectedCompany?.name ?? f.added_companies[0]?.name ?? "Company")
        : "Job Expert";
    const companyLogo =
      selectedCompany?.logo_url ??
      f.added_companies.find((c) => c.id === f.company_id)?.logo_url ??
      f.added_companies[0]?.logo_url ??
      null;
    const salary = resolveJobSalary(f.salary_min, f.salary_max, f.application_fee);
    const applicationFee = parseSalaryAmount(f.application_fee) || (f.fee_enabled ? 50 : 0);

    return {
      title: f.title.trim(),
      company_name: companyName,
      company_logo_url: companyLogo,
      category_id: f.category_id || null,
      job_type: f.job_type,
      employment_type: f.employment_type,
      location: f.location.trim() || "Saudi Arabia",
      salary: Number(salary),
      description: f.description || "",
      posted_by: f.posted_by,
      company_id: f.posted_by === "company" ? (f.company_id || null) : null,
      added_companies: f.added_companies,
      male_required: f.male_required,
      female_required: f.female_required,
      experience_required: f.experience_required || "1 - 2 Years",
      duty_timing: f.duty_timing,
      accommodation: f.accommodation,
      food: f.food,
      transport: f.transport,
      medical_insurance: f.medical_insurance,
      overtime: f.overtime,
      application_fee: f.fee_enabled ? applicationFee : 0,
    };
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    if (!f.title.trim()) {
      setErr("Job title is required.");
      setBusy(false);
      return;
    }
    const payload = buildPayload();
    if (!Number.isFinite(payload.salary) || payload.salary <= 0) {
      setErr("Enter a valid salary (e.g. 2500) or set an application fee.");
      setBusy(false);
      return;
    }

    if (isEdit && jobId) {
      const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);
      setBusy(false);
      if (error) { setErr(error.message); return; }
    } else {
      const { error } = await supabase.from("jobs").insert({ ...payload, status: "active" as const });
      setBusy(false);
      if (error) { setErr(error.message); return; }
    }
    nav({ to: "/admin/jobs" });
  };

  const steps = ["Job Details", "Company & Source", "Requirements", isEdit ? "Preview & Save" : "Preview & Publish"];
  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  if (loading) {
    return (
      <AdminLayout title={isEdit ? "Edit Job" : "Add New Job"} subtitle="Loading…">
        <div className="p-10 text-center text-muted-foreground">Loading job…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isEdit ? "Edit Job" : "Add New Job"}
      subtitle={isEdit ? "Update job details and save changes" : "Create a new job opening on the platform"}
    >
      <div className="bg-white rounded-2xl border border-border p-4 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const cur = n === step;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-emerald-500 text-white" : cur ? "bg-brand-blue text-white" : "bg-secondary text-muted-foreground"}`}>
                  {done ? <Check className="w-4 h-4" /> : n}
                </div>
                <div className={`text-sm font-semibold ${cur || done ? "text-brand-navy" : "text-muted-foreground"}`}>{label}</div>
              </div>
            );
          })}
        </div>

        {err && <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">{err}</div>}

        <div className="mt-6">
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Job Title *"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Delivery Driver" className="inp" /></Field>
              <Field label="Job Category *">
                <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} className="inp">
                  <option value="">Select category</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Job Type *">
                <select value={f.job_type} onChange={(e) => setF({ ...f, job_type: e.target.value })} className="inp">
                  {["Full-time","Part-time","Contract","Internship"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Employment Type *">
                <select value={f.employment_type} onChange={(e) => setF({ ...f, employment_type: e.target.value })} className="inp">
                  {["Permanent","Temporary","Seasonal"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Location *">
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="e.g. Riyadh, Saudi Arabia" className="inp pr-9" />
                </div>
              </Field>
              <Field label="Salary (SAR)">
                <div className="flex items-center gap-2">
                  <input value={f.salary_min} onChange={(e) => setF({ ...f, salary_min: e.target.value })} placeholder="Min e.g. 2500" className="inp" />
                  <span className="text-muted-foreground text-xs">to</span>
                  <input value={f.salary_max} onChange={(e) => setF({ ...f, salary_max: e.target.value })} placeholder="Max e.g. 3500" className="inp" />
                </div>
                <label className="text-xs flex items-center gap-2 mt-2"><input type="checkbox" checked={!f.salary_disclosed} onChange={(e) => setF({ ...f, salary_disclosed: !e.target.checked })} /> Salary not disclosed</label>
              </Field>
              <div className="lg:col-span-2">
                <Field label="Job Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={6} placeholder="Write detailed job description…" className="inp" /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <div className="text-sm font-bold text-brand-navy">Job Source</div>
                <div className="text-xs text-muted-foreground mb-3">Choose how this job is posted on the platform</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["admin","company"] as const).map((v) => {
                    const active = f.posted_by === v;
                    return (
                      <button key={v} type="button" onClick={() => setF({ ...f, posted_by: v })}
                        className={`text-left p-4 rounded-xl border ${active ? "border-brand-blue ring-1 ring-brand-blue bg-brand-blue/5" : "border-border"}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Building2 className="w-5 h-5 text-brand-navy" /></div>
                          <div className="flex-1">
                            <div className="font-semibold text-brand-navy">{v === "admin" ? "Posted by Admin (You)" : "Posted by Company"}</div>
                            <div className="text-xs text-muted-foreground">{v === "admin" ? "This job will be posted on behalf of an admin." : "This job is posted by a registered company."}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border ${active ? "border-brand-blue bg-brand-blue" : "border-border"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {f.posted_by === "company" && (
                <>
                  <Field label="Select Company *">
                    <select value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })} className="inp">
                      <option value="">Choose a company</option>
                      {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <div />
                  <div className="lg:col-span-2 border-t border-border pt-4">
                    <div className="text-sm font-bold text-brand-navy mb-3">Or Add New Company</div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Field label="Company Name *"><input value={f.new_co_name} onChange={(e) => setF({ ...f, new_co_name: e.target.value })} placeholder="e.g. HungerStation" className="inp" /></Field>
                      <Field label="Company Website"><input value={f.new_co_website} onChange={(e) => setF({ ...f, new_co_website: e.target.value })} placeholder="e.g. https://www.hungerstation.com" className="inp" /></Field>
                      <Field label="Company Logo">
                        <div className="flex items-center gap-3">
                          <label className="flex-1 cursor-pointer border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground hover:bg-secondary">
                            <Upload className="w-5 h-5 mx-auto" />
                            <div className="mt-1 font-semibold text-brand-navy">{uploading ? "Uploading…" : "Upload Logo"}</div>
                            <div>PNG, JPG up to 2MB</div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                          </label>
                          {f.new_co_logo && <img src={f.new_co_logo} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />}
                        </div>
                      </Field>
                      <div className="flex items-end">
                        <button type="button" onClick={addNewCompany} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-navy text-white text-sm font-semibold">
                          <Plus className="w-4 h-4" /> Add Company
                        </button>
                      </div>
                    </div>

                    {f.added_companies.length > 0 && (
                      <div className="mt-5">
                        <div className="text-sm font-bold text-brand-navy mb-2">Added Companies</div>
                        <div className="space-y-2">
                          {f.added_companies.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2">
                              <div className="w-9 h-9 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                                {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-muted-foreground" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-brand-navy text-sm flex items-center gap-1">{c.name} <BadgeCheck className="w-3.5 h-3.5 text-brand-blue" /></div>
                                <div className="text-[11px] text-muted-foreground">{c.website ?? "—"}</div>
                              </div>
                              <button type="button" onClick={() => setF((p) => ({ ...p, added_companies: p.added_companies.filter((x) => x.id !== c.id) }))} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-600" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="lg:col-span-2 border border-rose-200 bg-rose-50/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-brand-navy">Application Fee</div>
                    <div className="text-xs text-muted-foreground">Set application fee for this job</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={f.fee_enabled} onChange={(e) => setF({ ...f, fee_enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-border peer-checked:bg-brand-blue rounded-full relative transition">
                      <div className={`absolute top-0.5 ${f.fee_enabled ? "left-5" : "left-0.5"} w-5 h-5 bg-white rounded-full transition`} />
                    </div>
                  </label>
                </div>
                {f.fee_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Field label="Fee Amount (SAR) *">
                      <AmountInput value={f.application_fee} onChange={(v) => setF({ ...f, application_fee: v })} />
                      <div className="text-[11px] text-muted-foreground mt-1">Enter amount in Saudi Riyal (SAR)</div>
                    </Field>
                  </div>
                )}
                <div className="mt-3 bg-white border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">ⓘ Applicants have to pay this amount to apply for this job.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Experience Required"><input value={f.experience_required} onChange={(e) => setF({ ...f, experience_required: e.target.value })} placeholder="e.g. 1-2 years" className="inp" /></Field>
              <Field label="Duty Timing"><input value={f.duty_timing} onChange={(e) => setF({ ...f, duty_timing: e.target.value })} placeholder="e.g. 8 hours / shift" className="inp" /></Field>
              <Field label="Male Required"><AmountInput value={f.male_required} onChange={(v) => setF({ ...f, male_required: v })} /></Field>
              <Field label="Female Required"><AmountInput value={f.female_required} onChange={(v) => setF({ ...f, female_required: v })} /></Field>
              <div className="lg:col-span-2">
                <div className="text-sm font-bold text-brand-navy mb-2">Facilities</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {([
                    ["accommodation","Free Accommodation"],["food","Free Food"],["transport","Free Transport"],
                    ["medical_insurance","Medical Insurance"],["overtime","Overtime"],
                  ] as const).map(([k, label]) => (
                    <label key={k} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm ${(f[k] as boolean) ? "border-brand-blue bg-brand-blue/5" : "border-border"}`}>
                      <input type="checkbox" checked={f[k] as boolean} onChange={(e) => setF({ ...f, [k]: e.target.checked } as Form)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-secondary/40 rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Preview</div>
                <div className="mt-2 text-2xl font-extrabold text-brand-navy">{f.title || "Untitled job"}</div>
                <div className="text-sm text-muted-foreground">{f.location || "Location"} · {cats.find((c) => c.id === f.category_id)?.name ?? "Category"} · {f.job_type}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {f.salary_disclosed && (f.salary_min || f.salary_max) && (
                    <Pill>{parseSalaryAmount(f.salary_min) || "0"}–{parseSalaryAmount(f.salary_max) || parseSalaryAmount(f.salary_min) || "0"} SAR</Pill>
                  )}
                  {f.experience_required && <Pill>Exp: {f.experience_required}</Pill>}
                  {f.male_required > 0 && <Pill>Male: {f.male_required}</Pill>}
                  {f.female_required > 0 && <Pill>Female: {f.female_required}</Pill>}
                  {f.accommodation && <Pill>Accommodation</Pill>}
                  {f.food && <Pill>Food</Pill>}
                  {f.transport && <Pill>Transport</Pill>}
                  {f.medical_insurance && <Pill>Medical</Pill>}
                  {f.overtime && <Pill>Overtime</Pill>}
                </div>
                <div className="mt-4 text-sm whitespace-pre-wrap text-brand-navy/80">{f.description || "No description"}</div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Source: {f.posted_by === "admin" ? "Posted by Admin" : `Posted by ${cos.find((c) => c.id === f.company_id)?.name ?? "Company"}`} · Fee: {f.fee_enabled ? `${f.application_fee} SAR` : "Free"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={step === 1 ? () => nav({ to: "/admin/jobs" }) : back} className="px-5 py-2 rounded-lg border border-border text-sm font-semibold">
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button type="button" onClick={next} className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold">
              Next: {steps[step]}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={save} className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? "Saving…" : isEdit ? "Save Changes" : "Publish Job"}
            </button>
          )}
        </div>
      </div>

      <style>{`.inp{width:100%;padding:.55rem .75rem;border:1px solid hsl(var(--border));border-radius:.5rem;font-size:.875rem;background:white;}`}</style>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-bold text-brand-navy">{label}</label><div className="mt-1.5">{children}</div></div>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded-md bg-white border border-border text-brand-navy font-semibold">{children}</span>;
}
