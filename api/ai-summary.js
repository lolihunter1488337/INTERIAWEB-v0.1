// AI-сводка артиста через Groq (llama-3)
// Режим 1 (есть сообщения чата): AI анализирует переписку → конкретные действия
// Режим 2 (нет сообщений): детерминированная сводка из данных панели (без AI, без фантазий)
import { authUser } from "./_users.js";
const KVURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const GROQ  = process.env.GROQ_API_KEY;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}

async function groq(system, user) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + GROQ, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", max_tokens: 200, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || null;
}

// Детерминированная сводка — только факты из данных, никакой фантазии
function dataNote(a) {
  const tracks = Array.isArray(a.tracks) ? a.tracks : [];
  const lines = [];
  if (!a.docs) lines.push("📄 Запросить форму документов");
  for (const t of tracks) {
    if (t.released) continue;
    const name = t.title ? "«" + t.title + "»" : "трек";
    if (!t.form)        lines.push("📝 Напомнить заполнить форму трека: " + name);
    else if (!t.cover)  lines.push("🎨 Запросить обложку: " + name);
    else if (!t.shipped)lines.push("🚀 Отгрузить на DSP: " + name);
    else                lines.push("⏳ Ждёт выхода: " + name);
  }
  if (tracks.length > 0 && tracks.every(t => t.released)) lines.push("✅ Все треки вышли — запросить новый материал");
  if (tracks.length === 0 && a.docs) lines.push("🎵 Нет треков — запросить материал для работы");
  if (a.last) {
    const days = Math.floor((Date.now() - new Date(a.last).getTime()) / 86400000);
    if (days >= 14) lines.push("🔴 Не отвечает " + days + " дн. — срочно написать");
    else if (days >= 7) lines.push("🟡 Молчит " + days + " дн. — написать в чат");
  }
  return lines.length ? lines.join(". ") : "Всё в порядке.";
}

async function detectIntent(msgs) {
  if (!msgs || msgs.length < 2) return null;
  const dialog = msgs.slice(-15).map(m => m.from + ": " + m.text).join("\n").slice(0, 2000);
  const system = "Ты анализируешь переписку артиста с музыкальным лейблом. Определи намерение артиста относительно новых релизов. Ответь ТОЛЬКО одним ключевым словом и через дефис краткое пояснение на русском (до 8 слов). Варианты: new_track (хочет/готов отгрузить новый трек), in_progress (дорабатывает, скоро будет), promised (назвал дату или срок), left (отказывается от сотрудничества), unknown (неясно). Пример: in_progress - финализирует микс, отгрузит на неделе";
  const raw = await groq(system, dialog);
  if (!raw) return null;
  const types = ["new_track", "in_progress", "promised", "left", "unknown"];
  const found = types.find(t => raw.toLowerCase().startsWith(t));
  if (!found || found === "unknown") return null;
  const detail = raw.includes(" - ") ? raw.split(" - ").slice(1).join(" - ").trim() : "";
  return { type: found, detail, updatedAt: new Date().toISOString().slice(0, 10) };
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

  const artistsRaw = await kv(["GET", "interia:artists"]);
  let artists = [];
  try { artists = JSON.parse(artistsRaw || "[]"); } catch {}
  const idx = artists.findIndex(a => String(a.tgChatId) === String(tgChatId));
  if (idx < 0) return res.status(404).json({ ok: false, error: "артист не найден" });
  const a = artists[idx];

  const raw = await kv(["GET", "interia:msgs:" + tgChatId]);
  let msgs = [];
  try { msgs = JSON.parse(raw || "[]"); } catch {}

  let summary, prefix, intent = null;

  if (msgs.length > 0) {
    // Режим 1: AI по чату — строго только то что есть в переписке
    const dialog = msgs.map(m => m.from + ": " + m.text).join("\n").slice(0, 3000);
    summary = await groq(
      "Ты помощник менеджера лейбла INTERIA!. Прочитай переписку и напиши только то что реально обсуждалось — конкретные следующие шаги. Начинай с глагола. Максимум 3 пункта через точку. ВАЖНО: не придумывай ничего чего нет в тексте.",
      dialog
    );
    prefix = "🧠";
    intent = await detectIntent(msgs);
  } else {
    // Режим 2: без AI — только факты из панели
    summary = dataNote(a);
    prefix = "📊";
  }

  if (!summary) return res.status(502).json({ ok: false, error: "Groq не ответил" });

  artists[idx].note = prefix + " " + new Date().toLocaleDateString("ru-RU") + ": " + summary;
  if (intent) artists[idx].intent = intent;
  await kv(["SET", "interia:artists", JSON.stringify(artists)]);

  return res.status(200).json({ ok: true, summary, intent: artists[idx].intent || null, source: msgs.length > 0 ? "chat" : "data" });
}
