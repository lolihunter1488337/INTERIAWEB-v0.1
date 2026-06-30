// Vercel Serverless Function — приём демки и отправка в Telegram (нескольким получателям)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name = "", contact = "", link = "", about = "", website = "" } = body || {};
    if (website) return res.status(200).json({ ok: true }); // honeypot

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chats = String(process.env.TELEGRAM_CHAT_ID || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    if (!token || !chats.length) return res.status(500).json({ ok: false, error: "not_configured" });

    const esc = (s) => String(s).slice(0, 1000);
    const text =
      "🎧 НОВАЯ ДЕМКА — INTERIA!\n\n" +
      "👤 Артист: " + esc(name) + "\n" +
      "✉️ Контакт: " + esc(contact) + "\n" +
      "🔗 Трек: " + esc(link) + "\n" +
      "📝 О себе: " + esc(about);

    const results = await Promise.all(chats.map((chat_id) =>
      fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, disable_web_page_preview: false }),
      }).then((r) => r.json()).catch((e) => ({ ok: false, description: String(e) }))
    ));

    const okCount = results.filter((r) => r && r.ok).length;
    if (okCount === 0) return res.status(502).json({ ok: false, error: results.map((r) => r && r.description).join("; ") });
    return res.status(200).json({ ok: true, delivered: okCount });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
}
