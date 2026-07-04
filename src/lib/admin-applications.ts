export const ADMIN_APPLICATION_LIST_SELECT =
  "id, application_id, created_at, payment_status, application_status, user_id, recharge_pin, full_name, email, phone, amount_paid, job:jobs(title, location, company_name, company:companies(name, logo_url))";

export const ADMIN_APPLICATION_DETAIL_SELECT =
  "*, job:jobs(title, location, application_fee, company_name, company:companies(name, logo_url))";

export const ADMIN_PAYMENT_SELECT =
  "id, application_id, recharge_pin, payment_status, created_at, user_id, full_name, phone, amount_paid, job:jobs(title, application_fee)";

export const ADMIN_DASHBOARD_APP_SELECT =
  "id, created_at, application_status, full_name, job:jobs(title, company_name, company:companies(name))";
