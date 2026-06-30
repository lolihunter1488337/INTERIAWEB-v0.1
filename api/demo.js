// Vercel Serverless Function — приём демки -> Telegram-группа INTERIA FORM
const GROUP_CHAT_ID = "-1003935357575"; // супергруппа "INTERIA FORM"
const VERSION = 4;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method", v: VERSION });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name = "", contact = "", link = "", about = "", website = "" } = body || {};
    if (website) return res.status(200).json({ ok: true, v: VERSION });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ ok: false, error: "no_token", v: VERSION });

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
    if (!j.ok) return res.status(502).json({ ok: false, error: j.description || "telegram_error", v: VERSION, target: GROUP_CHAT_ID });
    const c = j.result && j.result.chat || {};
    return res.status(200).json({ ok: true, v: VERSION, target: GROUP_CHAT_ID, to_id: c.id, to_type: c.type, to_title: c.title || c.username });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e), v: VERSION });
  }
}
