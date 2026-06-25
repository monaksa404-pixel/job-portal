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
  category?: Category | null;
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