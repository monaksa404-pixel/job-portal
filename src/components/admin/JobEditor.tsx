import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AmountInput } from "@/components/AmountInput";
import { supabase } from "@/integrations/supabase/client";
import { Check, MapPin, Building2, Upload, Plus, ChevronDown } from "lucide-react";
import { parseSalaryAmount, resolveJobSalary } from "@/lib/utils";
import { readSalaryMax, packSalaryMeta, packDescriptionSalary, salaryRangeLabel, stripSalaryFromDescription } from "@/lib/job-salary";

type Category = { id: string; name: string };
type Company = { id: string; name: string; logo_url: string | null; website: string | null; verified: boolean };
type Form = {
  title: string; category_id: string; job_type: string; employment_type: string;
  location: string; salary_min: string; salary_max: string; salary_disclosed: boolean;
  description: string;
  rating: number; reviews_count: number;
  posted_by: "admin" | "company"; company_id: string;
  edit_co_name: string; edit_co_logo: string; edit_co_website: string;
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
  rating: 4.5, reviews_count: 120,
  posted_by: "admin", company_id: "", edit_co_name: "", edit_co_logo: "", edit_co_website: "",
  new_co_name: "", new_co_logo: "", new_co_website: "",
  added_companies: [], male_required: 0, female_required: 0, experience_required: "",
  duty_timing: "8 hours", accommodation: false, food: false, transport: false, medical_insurance: false, overtime: false,
  fee_enabled: true, application_fee: 50,
};

type DbJob = Form & {
  id: string;
  salary: number;
  salary_max?: number | null;
  company_name?: string;
  company_logo_url?: string | null;
  company_website?: string | null;
  responsibilities?: string[];
  application_fee: number;
  company_id: string | null;
  posted_by: string;
  added_companies: Form["added_companies"];
  status: string;
  rating: number;
  reviews_count: number;
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

  const loadCompanies = async () => {
    const { data } = await supabase.from("companies").select("id, name, logo_url, website, verified").order("name");
    setCos((data ?? []) as Company[]);
  };

  useEffect(() => {
    supabase.from("categories").select("id, name").order("sort_order").then(({ data }) => setCats((data ?? []) as Category[]));
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setErr("Job not found.");
          setLoading(false);
          return;
        }
        const j = data as unknown as DbJob;
        const maxSalary = readSalaryMax({ ...j, salary: j.salary });
        const jobBrandName = j.company_name && j.company_name !== "Job Expert" ? j.company_name : "";
        let editFields = {
          edit_co_name: jobBrandName,
          edit_co_logo: j.company_logo_url ?? "",
          edit_co_website: j.company_website ?? "",
        };
        if (j.company_id) {
          const { data: coRow } = await supabase.from("companies").select("name, logo_url, website").eq("id", j.company_id).maybeSingle();
          if (coRow) {
            editFields = {
              edit_co_name: jobBrandName || coRow.name || "",
              edit_co_logo: j.company_logo_url || coRow.logo_url || "",
              edit_co_website: j.company_website || coRow.website || "",
            };
          }
        }
        setF({
          title: j.title ?? "",
          category_id: j.category_id ?? "",
          job_type: j.job_type ?? "Full-time",
          employment_type: j.employment_type ?? "Permanent",
          location: j.location ?? "",
          salary_min: j.salary ? String(j.salary) : "",
          salary_max: maxSalary ? String(maxSalary) : "",
          salary_disclosed: true,
          description: stripSalaryFromDescription(j.description ?? ""),
          posted_by: j.posted_by === "company" ? "company" : "admin",
          company_id: j.company_id ?? "",
          ...editFields,
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
          rating: j.rating ?? 4.5,
          reviews_count: j.reviews_count ?? 0,
        });
        setLoading(false);
      });
  }, [jobId]);

  const uploadLogo = async (file: File, target: "new" | "edit" = "new") => {
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
    setF((p) => target === "edit" ? { ...p, edit_co_logo: data.publicUrl } : { ...p, new_co_logo: data.publicUrl });
    setUploading(false);
  };

  const pickCompany = (companyId: string) => {
    const co = cos.find((c) => c.id === companyId);
    setF((p) => ({
      ...p,
      company_id: companyId,
      edit_co_name: co?.name ?? "",
      edit_co_logo: co?.logo_url ?? "",
      edit_co_website: co?.website ?? "",
    }));
  };

  const addNewCompany = async () => {
    if (!f.new_co_name.trim()) { setErr("Company name is required."); return; }
    const { data, error } = await supabase.from("companies").insert({
      name: f.new_co_name.trim(),
      logo_url: f.new_co_logo || null,
      website: f.new_co_website.trim() || null,
      status: true,
    }).select().single();
    if (error) { setErr(error.message); return; }
    const co = data as Company;
    await loadCompanies();
    setF((p) => ({
      ...p,
      company_id: co.id,
      edit_co_name: co.name,
      edit_co_logo: co.logo_url ?? "",
      edit_co_website: co.website ?? "",
      added_companies: [...p.added_companies.filter((x) => x.id !== co.id), { id: co.id, name: co.name, logo_url: co.logo_url, website: co.website }],
      new_co_name: "", new_co_logo: "", new_co_website: "",
      posted_by: "company",
    }));
  };

  const buildPayload = () => {
    const selectedCo = f.company_id ? cos.find((c) => c.id === f.company_id) : null;
    const brandingName = f.edit_co_name.trim();
    const brandingLogo = f.edit_co_logo.trim() || null;
    const brandingWebsite = f.edit_co_website.trim() || null;
    const companyName = brandingName || selectedCo?.name || "Job Expert";
    const companyLogo = brandingLogo ?? selectedCo?.logo_url ?? null;
    const companyWebsite = brandingWebsite ?? selectedCo?.website ?? null;
    const useCompany = !!f.company_id || !!brandingName;
    const { salary, salary_max } = resolveJobSalary(f.salary_min, f.salary_max, f.application_fee);
    const applicationFee = parseSalaryAmount(f.application_fee) || (f.fee_enabled ? 50 : 0);
    const rating = Math.min(5, Math.max(1, Number(f.rating) || 4.5));
    const reviewsCount = Math.max(0, Math.floor(Number(f.reviews_count) || 0));
    const selectedCompany = selectedCo;
    const syncedCompanies = useCompany && selectedCompany
      ? [{ id: selectedCompany.id, name: companyName, logo_url: companyLogo, website: companyWebsite }]
      : f.added_companies.length
        ? f.added_companies.map((c) =>
            c.id === f.company_id
              ? { ...c, name: companyName, logo_url: companyLogo, website: companyWebsite }
              : c,
          )
        : brandingName
          ? [{ id: f.company_id || "local", name: companyName, logo_url: companyLogo, website: companyWebsite }]
          : f.added_companies;

    return {
      title: f.title.trim(),
      company_name: companyName,
      company_logo_url: companyLogo,
      company_website: companyWebsite,
      category_id: f.category_id || null,
      job_type: f.job_type,
      employment_type: f.employment_type,
      location: f.location.trim() || "Saudi Arabia",
      salary,
      salary_max,
      description: f.description || "",
      rating,
      reviews_count: reviewsCount,
      verified: useCompany ? (selectedCompany?.verified ?? true) : true,
      posted_by: useCompany || brandingName ? "company" : f.posted_by,
      company_id: useCompany ? f.company_id : null,
      added_companies: syncedCompanies,
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
    if (!f.category_id) {
      setErr("Job category is required.");
      setBusy(false);
      return;
    }
    const payload = buildPayload();
    if (!Number.isFinite(payload.salary) || payload.salary <= 0) {
      setErr("Enter a valid salary (e.g. 2500) or set an application fee.");
      setBusy(false);
      return;
    }

    if (f.company_id) {
      const { error: coErr } = await supabase.from("companies").update({
        name: payload.company_name,
        logo_url: payload.company_logo_url,
        website: payload.company_website,
      }).eq("id", f.company_id);
      if (coErr) {
        setErr(coErr.message);
        setBusy(false);
        return;
      }
      await loadCompanies();
    }

    let currentResp: string[] = [];
    if (isEdit && jobId) {
      const { data: ex } = await supabase.from("jobs").select("responsibilities").eq("id", jobId).maybeSingle();
      currentResp = (ex?.responsibilities as string[]) ?? [];
    }

    const savePayload = {
      ...payload,
      description: packDescriptionSalary(payload.description, payload.salary_max),
      responsibilities: packSalaryMeta(currentResp, payload.salary_max),
    };

    const trySave = async (row: typeof savePayload & { status?: "active" }) => {
      if (isEdit && jobId) {
        return supabase.from("jobs").update(row).eq("id", jobId);
      }
      return supabase.from("jobs").insert({ ...row, status: "active" as const });
    };

    let { error } = await trySave(savePayload);
    if (error?.message?.toLowerCase().includes("salary_max")) {
      const { salary_max: _drop, ...withoutMax } = savePayload;
      ({ error } = await trySave(withoutMax));
    }
    setBusy(false);
    if (error) { setErr(error.message); return; }
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
                <OptionPicker
                  value={f.job_type}
                  options={["Full-time", "Part-time", "Contract", "Internship"]}
                  onChange={(v) => setF({ ...f, job_type: v })}
                />
              </Field>
              <Field label="Employment Type *">
                <OptionPicker
                  value={f.employment_type}
                  options={["Permanent", "Temporary", "Seasonal"]}
                  onChange={(v) => setF({ ...f, employment_type: v })}
                />
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
              <Field label="Rating (1–5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={f.rating}
                  onChange={(e) => setF({ ...f, rating: Number(e.target.value) || 4.5 })}
                  className="inp"
                />
              </Field>
              <Field label="Reviews Count">
                <AmountInput value={f.reviews_count} onChange={(v) => setF({ ...f, reviews_count: v })} />
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

              <div className="lg:col-span-2 border-t border-border pt-4">
                <div className="text-sm font-bold text-brand-navy mb-3">Company Branding on Job Listing</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-secondary/30 rounded-xl p-4">
                  <Field label="Company Name">
                    <input value={f.edit_co_name} onChange={(e) => setF({ ...f, edit_co_name: e.target.value })} placeholder="e.g. Saudi German Hospital" className="inp" />
                  </Field>
                  <Field label="Company Website">
                    <input value={f.edit_co_website} onChange={(e) => setF({ ...f, edit_co_website: e.target.value })} placeholder="https://www.example.com" className="inp" />
                  </Field>
                  <Field label="Company Logo">
                    <div className="flex items-center gap-3">
                      {f.edit_co_logo ? <img src={f.edit_co_logo} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" /> : <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center"><Building2 className="w-5 h-5 text-muted-foreground" /></div>}
                      <label className="cursor-pointer px-3 py-2 rounded-lg border border-border text-sm hover:bg-white">
                        {uploading ? "Uploading…" : "Upload Logo"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "edit")} />
                      </label>
                    </div>
                  </Field>
                </div>
              </div>

              <div className="lg:col-span-2 border-t border-border pt-4">
                <div className="text-sm font-bold text-brand-navy mb-3">Link to Company Record (optional)</div>
                <Field label="Select Company">
                  <select value={f.company_id} onChange={(e) => pickCompany(e.target.value)} className="inp">
                    <option value="">No linked company</option>
                    {cos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>

                <div className="mt-5">
                  <div className="text-sm font-bold text-brand-navy mb-3">Add New Company</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Field label="Company Name *"><input value={f.new_co_name} onChange={(e) => setF({ ...f, new_co_name: e.target.value })} placeholder="e.g. STC" className="inp" /></Field>
                    <Field label="Company Website"><input value={f.new_co_website} onChange={(e) => setF({ ...f, new_co_website: e.target.value })} placeholder="https://" className="inp" /></Field>
                    <Field label="Company Logo">
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground hover:bg-secondary">
                          <Upload className="w-5 h-5 mx-auto" />
                          <div className="mt-1 font-semibold text-brand-navy">{uploading ? "Uploading…" : "Upload Logo"}</div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "new")} />
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
                </div>
              </div>

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
                    <Pill>
                      {salaryRangeLabel(
                        parseSalaryAmount(f.salary_min),
                        parseSalaryAmount(f.salary_max) > 0 ? parseSalaryAmount(f.salary_max) : null,
                      )}
                    </Pill>
                  )}
                  {f.experience_required && <Pill>Exp: {f.experience_required}</Pill>}
                  <Pill>{f.rating} ★ · {f.reviews_count} Reviews</Pill>
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

function OptionPicker({
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inp text-left flex items-center justify-between gap-2">
        <span className={value ? "text-brand-navy" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-brand-navy border-b border-border last:border-0 hover:bg-secondary/40"
                >
                  <span>{opt}</span>
                  {selected ? <span className="text-base leading-none">✔️</span> : <span className="w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded-md bg-white border border-border text-brand-navy font-semibold">{children}</span>;
}
