export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  status: boolean;
  sort_order: number;
  jobs_count?: number;
};

export type Job = {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  company_id?: string | null;
  category_id: string | null;
  salary: number;
  salary_currency: string;
  salary_period: string;
  location: string;
  job_type: string;
  work_mode: string;
  duty_timing: string;
  experience_required: string;
  male_required: number;
  female_required: number;
  accommodation: boolean;
  food: boolean;
  transport: boolean;
  medical_insurance: boolean;
  overtime: boolean;
  application_fee: number;
  description: string;
  responsibilities: string[];
  rating: number;
  reviews_count: number;
  verified: boolean;
  status: "active" | "closed" | "draft";
  created_at: string;
  added_companies?: { id: string; name: string; logo_url: string | null; website: string | null }[];
  category?: Category | null;
  company?: {
    name: string;
    logo_url: string | null;
    website: string | null;
    verified: boolean;
  } | null;
};

export type Application = {
  id: string;
  application_id: string;
  user_id: string;
  job_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  application_status: "under_review" | "accepted" | "rejected";
  payment_status: "pending" | "verified" | "rejected";
  amount_paid: number;
  recharge_pin: string;
  created_at: string;
  job?: Job;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "job_alert" | "application_update" | "system";
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type Popup = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_viewed: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  country: string | null;
  gender: "male" | "female" | null;
  date_of_birth: string | null;
  avatar_url: string | null;
};

export type NotificationPrefs = {
  user_id: string;
  job_alerts: boolean;
  application_updates: boolean;
  system_updates: boolean;
};

export type UserDocument = {
  id: string;
  user_id: string;
  kind: string;
  name: string;
  url: string;
  size_bytes: number;
  created_at: string;
};

export function profileCompleteness(p: Profile | null): number {
  if (!p) return 0;
  const fields = [p.full_name, p.phone, p.email, p.nationality, p.country, p.gender, p.date_of_birth, p.avatar_url];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}