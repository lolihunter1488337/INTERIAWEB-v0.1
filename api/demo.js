// Vercel Serverless Function — приём демки -> Telegram-группа INTERIA FORM
const GROUP_CHAT_ID = "-1003935357575"; // супергруппа "INTERIA FORM"
const KVURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kv(cmd) {
  if (!KVURL || !KVTOK) return null;
  try {
    const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
    return (await r.json()).result;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name = "", contact = "", link = "", about = "", website = "" } = body || {};
    if (website) return res.status(200).json({ ok: true }); // honeypot

    // анти-спам: не больше 5 заявок с одного IP за 10 минут
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const rlKey = "interia:rl:demo:" + ip;
    const n = await kv(["INCR", rlKey]);
    if (n === 1) await kv(["EXPIRE", rlKey, 600]);
    if (n && n > 5) return res.status(429).json({ ok: false, error: "too_many" });

    // минимальная валидация: нужен хотя бы контакт или ссылка
    if (!String(contact).trim() && !String(link).trim()) return res.status(200).json({ ok: true });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ ok: false, error: "config" });

    const esc = (s) => String(s).slice(0, 1000);
    const text =
      "🎧 НОВАЯ ДЕМКА — INTERIA!\n\n" +
      "👤 Артист: " + esc(name) + "\n" +
      "✉️ Контакт: " + esc(contact) + "\n" +
      "🔗 Трек: " + esc(link) + "\n" +
      "📝 О себе: " + esc(about);

    const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: GROUP_CHAT_ID, text, disable_web_page_preview: false }),
    });
    const j = await r.json();
    if (!j.ok) return res.status(502).json({ ok: false, error: "send_failed" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server" });
  }
}
