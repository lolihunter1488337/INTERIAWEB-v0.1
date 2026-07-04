// Авто-обновление AI-сводок всех активных артистов (Vercel Cron, 2:00 UTC = 5:00 МСК)
// Защита: x-vercel-cron: 1 (Vercel подставляет автоматически) или Authorization: Bearer CRON_SECRET
const KVURL = process.env.KV_REST_API_URL  || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN|| process.env.UPSTASH_REDIS_REST_TOKEN;
const GROQ  = process.env.GROQ_API_KEY;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}
async function kvGet(key) { const v = await kv(["GET", key]); try { return v ? JSON.parse(v) : null; } catch { return null; } }

async function summarize(msgs) {
  const dialog = msgs.map(m => m.from + ": " + m.text).join("\n").slice(0, 3000);
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || null;
}

export default async function handler(req, res) {
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth = cronSecret && req.headers.authorization === "Bearer " + cronSecret;
  if (!isVercelCron && !hasCronAuth) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!GROQ) return res.status(503).json({ ok: false, error: "no GROQ_API_KEY" });

  let artists = (await kvGet("interia:artists")) || [];
  const dateStr = new Date().toLocaleDateString("ru-RU");

  // Берём артистов с tgChatId, сортируем по активности, берём топ-15
  const withChat = artists
    .map((a, i) => ({ ...a, _idx: i }))
    .filter(a => a.tgChatId)
    .sort((a, b) => new Date(b.last || 0) - new Date(a.last || 0))
    .slice(0, 15);

  const updated = [];
  for (const a of withChat) {
    try {
      const msgs = await kvGet("interia:msgs:" + a.tgChatId);
      if (!msgs || !msgs.length) continue;
      const summary = await summarize(msgs);
      if (!summary) continue;
      artists[a._idx].note = "🧠 " + dateStr + ": " + summary;
      updated.push(a.artist);
    } catch { /* skip */ }
  }

  if (updated.length > 0) await kv(["SET", "interia:artists", JSON.stringify(artists)]);
  return res.json({ ok: true, updated: updated.length, artists: updated });
}
