// Разовая настройка вебхука Telegram. Открыть: /api/tg-setup?k=ВАШ_ПАРОЛЬ
import { authUser } from "./_users.js";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  const key = req.headers["x-panel-key"] || req.query.k || "";
  if (!authUser(key)) return res.status(401).json({ ok: false, error: "нужен пароль ?k=" });
  if (!TOKEN) return res.status(500).json({ ok: false, error: "нет TELEGRAM_BOT_TOKEN" });
  const url = "https://www.interiarecords.com/api/tg";
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message", "channel_post", "my_chat_member"], drop_pending_updates: true }),
  }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e) }));
  return res.json({ webhook_url: url, telegram: r });
}
