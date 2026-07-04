// Авто-обновление AI-сводок всех активных артистов (Vercel Cron, 2:00 UTC = 5:00 МСК)
const KVURL = process.env.KV_REST_API_URL  || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN|| process.env.UPSTASH_REDIS_REST_TOKEN;
const GROQ  = process.env.GROQ_API_KEY;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}
async function kvGet(key) { const v = await kv(["GET", key]); try { return v ? JSON.parse(v) : null; } catch { return null; } }

async function groq(system, user) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + GROQ, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", max_tokens: 250, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || null;
}

async function summarize(msgs) {
  const dialog = msgs.map(m => m.from + ": " + m.text).join("\n").slice(0, 3000);
  return groq(
    "Ты помощник менеджера музыкального лейбла INTERIA!. Прочитай переписку с артистом и напиши ТОЛЬКО конкретные действия — что надо сделать менеджеру прямо сейчас. Начинай каждый пункт с глагола. Максимум 3 коротких пункта через точку.",
    dialog
  );
}

async function detectIntent(msgs) {
  if (!msgs || msgs.length < 2) return null;
  const dialog = msgs.slice(-15).map(m => m.from + ": " + m.text).join("\n").slice(0, 2000);
  const system = [
    "Ты анализируешь переписку артиста с музыкальным лейблом.",
    "Определи намерение артиста относительно новых релизов.",
    "Ответь ТОЛЬКО одним ключевым словом и через дефис краткое пояснение на русском (до 8 слов).",
    "Варианты: new_track (хочет/готов отгрузить новый трек), in_progress (дорабатывает, скоро будет), promised (назвал дату или срок), left (отказывается от сотрудничества), unknown (неясно).",
    "Пример: in_progress - финализирует микс, отгрузит на неделе"
  ].join(" ");
  const raw = await groq(system, dialog);
  if (!raw) return null;
  const types = ["new_track", "in_progress", "promised", "left", "unknown"];
  const found = types.find(t => raw.toLowerCase().startsWith(t));
  if (!found || found === "unknown") return null;
  const detail = raw.includes(" - ") ? raw.split(" - ").slice(1).join(" - ").trim() : "";
  return { type: found, detail, updatedAt: new Date().toISOString().slice(0, 10) };
}

export default async function handler(req, res) {
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth = cronSecret && req.headers.authorization === "Bearer " + cronSecret;
  if (!isVercelCron && !hasCronAuth) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!GROQ) return res.status(503).json({ ok: false, error: "no GROQ_API_KEY" });

  let artists = (await kvGet("interia:artists")) || [];
  const dateStr = new Date().toLocaleDateString("ru-RU");

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
      const intent = await detectIntent(msgs);
      if (intent) artists[a._idx].intent = intent;
      updated.push(a.artist);
    } catch { /* skip */ }
  }

  if (updated.length > 0) await kv(["SET", "interia:artists", JSON.stringify(artists)]);
  return res.json({ ok: true, updated: updated.length, artists: updated });
}
