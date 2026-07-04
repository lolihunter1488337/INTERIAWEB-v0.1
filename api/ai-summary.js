// AI-сводка чата артиста через Groq (llama-3)
// POST { tgChatId } — читает последние сообщения из KV, спрашивает Groq, пишет в note артиста
import { authUser } from "./_users.js";
const KVURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const GROQ  = process.env.GROQ_API_KEY;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const key = req.headers["x-panel-key"] || "";
  if (!authUser(key)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!GROQ) return res.status(503).json({ ok: false, error: "GROQ_API_KEY не настроен" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { tgChatId } = body || {};
  if (!tgChatId) return res.status(400).json({ ok: false, error: "нет tgChatId" });

  // читаем сообщения
  const raw = await kv(["GET", "interia:msgs:" + tgChatId]);
  let msgs = [];
  try { msgs = JSON.parse(raw || "[]"); } catch {}
  if (!msgs.length) return res.status(200).json({ ok: false, error: "нет сообщений — пусть артист напишет в чат" });

  // форматируем для Groq
  const dialog = msgs.map(m => m.from + ": " + m.text).join("\n");

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + GROQ, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      messages: [
        { role: "system", content: "Ты помощник музыкального лейбла INTERIA!. Кратко резюмируй переписку с артистом: что обсуждалось, какой статус, что нужно сделать. Отвечай строго на русском, 2-3 предложения, без лишних слов." },
        { role: "user", content: dialog }
      ]
    })
  });

  const gj = await groqRes.json();
  const summary = gj?.choices?.[0]?.message?.content?.trim();
  if (!summary) return res.status(502).json({ ok: false, error: "Groq не ответил" });

  // пишем в note артиста
  const artistsRaw = await kv(["GET", "interia:artists"]);
  let artists = [];
  try { artists = JSON.parse(artistsRaw || "[]"); } catch {}
  const idx = artists.findIndex(a => String(a.tgChatId) === String(tgChatId));
  if (idx >= 0) {
    artists[idx].note = "🧠 " + new Date().toLocaleDateString("ru-RU") + ": " + summary;
    await kv(["SET", "interia:artists", JSON.stringify(artists)]);
  }

  return res.status(200).json({ ok: true, summary });
}
