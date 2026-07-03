// Отправка приветствия из панели: POST { chatId } (под логином) -> бот шлёт welcome в чат.
import { authUser } from "./_users.js";
import { welcomeText } from "./_welcome.js";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!authUser(req.headers["x-panel-key"] || "")) return res.status(401).json({ ok: false });
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const chatId = body && body.chatId;
  if (!chatId) return res.status(400).json({ ok: false, error: "нет chatId" });
  if (!TOKEN) return res.status(500).json({ ok: false, error: "no token" });
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: welcomeText(), disable_web_page_preview: true }),
  }).then((x) => x.json()).catch(() => null);
  return res.json({ ok: !!(r && r.ok), error: r && r.description });
}
