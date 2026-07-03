import { createServerFn } from "@tanstack/react-start";

export type TelegramPayload = {
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

    const pin = data.recharge_pin.trim();
    if (!pin) return { ok: false, error: "Empty PIN" };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: pin,
        reply_markup: {
          inline_keyboard: [[{ text: "📋 Copy PIN", copy_text: { text: pin } }]],
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[telegram] sendMessage failed", res.status, body);
      return { ok: false, error: `Telegram ${res.status}` };
    }
    return { ok: true };
  });
