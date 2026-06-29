// Vercel Serverless Function — приём демки и отправка в Telegram
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name = "", contact = "", link = "", about = "", website = "" } = body || {};
    if (website) return res.status(200).json({ ok: true }); // honeypot: бот попался

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) return res.status(500).json({ ok: false, error: "not_configured" });

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
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: false }),
    });
    const j = await r.json();
    if (!j.ok) return res.status(502).json({ ok: false, error: j.description || "telegram_error" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
}
